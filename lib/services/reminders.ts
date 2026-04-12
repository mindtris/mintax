"use server"

import { prisma } from "@/lib/core/db"
import { ReminderFormData } from "@/lib/schemas/reminders"
import { addDays, addMonths, addWeeks, addYears } from "date-fns"
import { cache } from "react"

export type ReminderFilters = {
  search?: string
  status?: string
  category?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
}

export const getReminders = cache(
  async (orgId: string, filters?: ReminderFilters, options?: { take?: number; skip?: number }) => {
    const where: any = { organizationId: orgId }

    if (filters?.status && filters.status !== "all") {
      where.status = filters.status
    }
    if (filters?.category && filters.category !== "all") {
      where.category = filters.category
    }
    if (filters?.priority && filters.priority !== "all") {
      where.priority = filters.priority
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ]
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.dueAt = {}
      if (filters.dateFrom) where.dueAt.gte = new Date(filters.dateFrom)
      if (filters?.dateTo) where.dueAt.lte = new Date(filters.dateTo)
    }

    const [items, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: { assignees: true },
        orderBy: { dueAt: "asc" },
        take: options?.take,
        skip: options?.skip,
      }),
      prisma.reminder.count({ where }),
    ])

    return { items, total }
  }
)

export const getReminderById = cache(async (id: string, orgId: string) => {
  return await prisma.reminder.findFirst({
    where: { id, organizationId: orgId },
    include: { assignees: true },
  })
})

export const getUpcomingReminders = cache(async (orgId: string, limit: number = 5) => {
  return await prisma.reminder.findMany({
    where: {
      organizationId: orgId,
      status: "pending",
      dueAt: { gte: new Date() },
    },
    include: { assignees: true },
    orderBy: { dueAt: "asc" },
    take: limit,
  })
})

export const getOverdueRemindersCount = cache(async (orgId: string) => {
  return await prisma.reminder.count({
    where: {
      organizationId: orgId,
      status: "pending",
      dueAt: { lt: new Date() },
    },
  })
})

export async function createReminder(orgId: string, createdById: string, data: ReminderFormData) {
  const { assigneeUserIds, ...reminderData } = data

  return await prisma.$transaction(async (tx) => {
    const reminder = await tx.reminder.create({
      data: {
        ...reminderData,
        organizationId: orgId,
        createdById,
      },
    })

    if (assigneeUserIds.length > 0) {
      await tx.reminderAssignee.createMany({
        data: assigneeUserIds.map((userId: string) => ({
          reminderId: reminder.id,
          userId,
        })),
      })
    }

    return await tx.reminder.findFirst({
      where: { id: reminder.id },
      include: { assignees: true },
    })
  })
}

export async function updateReminder(id: string, orgId: string, data: Partial<ReminderFormData>) {
  const { assigneeUserIds, ...reminderData } = data

  return await prisma.$transaction(async (tx) => {
    const reminder = await tx.reminder.update({
      where: { id, organizationId: orgId },
      data: reminderData,
    })

    if (assigneeUserIds !== undefined) {
      await tx.reminderAssignee.deleteMany({ where: { reminderId: id } })
      if (assigneeUserIds.length > 0) {
        await tx.reminderAssignee.createMany({
          data: assigneeUserIds.map((userId: string) => ({
            reminderId: id,
            userId,
          })),
        })
      }
    }

    return await tx.reminder.findFirst({
      where: { id: reminder.id },
      include: { assignees: true },
    })
  })
}

export async function deleteReminder(id: string, orgId: string) {
  return await prisma.reminder.delete({
    where: { id, organizationId: orgId },
  })
}

export async function completeReminder(id: string, orgId: string) {
  const reminder = await prisma.reminder.update({
    where: { id, organizationId: orgId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
    include: { assignees: true },
  })

  // Create next recurrence if applicable
  if (reminder.recurrence !== "one_time") {
    await createNextRecurrence(reminder)
  }

  return reminder
}

export async function createNextRecurrence(reminder: any) {
  const nextDueAt = calculateNextDueDate(reminder.dueAt, reminder.recurrence)
  if (!nextDueAt) return null

  // Don't create if past the recurrence end date
  if (reminder.recurrenceEndAt && nextDueAt > reminder.recurrenceEndAt) return null

  const parentId = reminder.parentId || reminder.id

  return await prisma.$transaction(async (tx) => {
    const newReminder = await tx.reminder.create({
      data: {
        organizationId: reminder.organizationId,
        createdById: reminder.createdById,
        title: reminder.title,
        description: reminder.description,
        dueAt: nextDueAt,
        category: reminder.category,
        priority: reminder.priority,
        status: "pending",
        recurrence: reminder.recurrence,
        recurrenceEndAt: reminder.recurrenceEndAt,
        parentId,
        emailNotify: reminder.emailNotify,
        emailNotifyMinutesBefore: reminder.emailNotifyMinutesBefore,
      },
    })

    // Copy assignees
    if (reminder.assignees?.length > 0) {
      await tx.reminderAssignee.createMany({
        data: reminder.assignees.map((a: any) => ({
          reminderId: newReminder.id,
          userId: a.userId,
        })),
      })
    }

    return newReminder
  })
}

function calculateNextDueDate(currentDueAt: Date, recurrence: string): Date | null {
  switch (recurrence) {
    case "daily":
      return addDays(currentDueAt, 1)
    case "weekly":
      return addWeeks(currentDueAt, 1)
    case "monthly":
      return addMonths(currentDueAt, 1)
    case "yearly":
      return addYears(currentDueAt, 1)
    default:
      return null
  }
}

// Used by the cron job to find reminders that need email notifications
export async function getDueRemindersForNotification() {
  const now = new Date()

  return await prisma.reminder.findMany({
    where: {
      emailNotify: true,
      emailSentAt: null,
      status: "pending",
    },
    include: {
      assignees: true,
      organization: { select: { name: true } },
    },
  })
}

export async function markEmailSent(id: string) {
  return await prisma.reminder.update({
    where: { id },
    data: { emailSentAt: new Date() },
  })
}

export async function deleteRecurrenceSeries(parentId: string, orgId: string) {
  return await prisma.reminder.deleteMany({
    where: {
      organizationId: orgId,
      OR: [{ id: parentId }, { parentId }],
      status: "pending",
    },
  })
}

"use server"

import { prisma } from "@/lib/core/db"
import { autoAssignCOA } from "./automation"
import { sendBillRecurringEmail } from "@/lib/integrations/email"
import { getSettings, getSettingsBatch } from "@/lib/services/settings"
import { addDays, addMonths, addWeeks, addYears } from "date-fns"
import { cache } from "react"

export type RecurringTransactionInput = {
  name: string
  description?: string
  merchant?: string
  total?: number
  currencyCode?: string
  type?: string
  categoryCode?: string
  projectCode?: string
  bankAccountId?: string
  note?: string
  recurrence: string
  nextRunAt: Date
  endAt?: Date
}

export const getRecurringTransactions = cache(async (orgId: string) => {
  return await prisma.recurringTransaction.findMany({
    where: { organizationId: orgId },
    orderBy: { nextRunAt: "asc" },
  })
})

export const getActiveRecurringTransactions = cache(async (orgId: string) => {
  return await prisma.recurringTransaction.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { nextRunAt: "asc" },
  })
})

export async function createRecurringTransaction(orgId: string, userId: string, data: RecurringTransactionInput) {
  const chartAccountId = await autoAssignCOA(orgId, data.categoryCode || null, data.type || "expense")

  return await prisma.recurringTransaction.create({
    data: {
      organizationId: orgId,
      userId,
      name: data.name,
      description: data.description,
      merchant: data.merchant,
      total: data.total,
      currencyCode: data.currencyCode,
      type: data.type || "expense",
      categoryCode: data.categoryCode,
      projectCode: data.projectCode,
      bankAccountId: data.bankAccountId,
      chartAccountId,
      note: data.note,
      recurrence: data.recurrence,
      nextRunAt: data.nextRunAt,
      endAt: data.endAt,
    },
  })
}

export async function updateRecurringTransaction(id: string, orgId: string, data: Partial<RecurringTransactionInput>) {
  return await prisma.recurringTransaction.update({
    where: { id, organizationId: orgId },
    data,
  })
}

export async function deleteRecurringTransaction(id: string, orgId: string) {
  return await prisma.recurringTransaction.delete({
    where: { id, organizationId: orgId },
  })
}

export async function toggleRecurringTransaction(id: string, orgId: string) {
  const rt = await prisma.recurringTransaction.findFirst({ where: { id, organizationId: orgId } })
  if (!rt) return null
  return await prisma.recurringTransaction.update({
    where: { id },
    data: { isActive: !rt.isActive },
  })
}

/**
 * Process all due recurring transactions across all orgs.
 * Called by the cron job. Sends notification emails to admins.
 */
export async function processDueRecurringTransactions(): Promise<{ created: number; emailsSent: number }> {
  const now = new Date()

  const dueTransactions = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
    },
  })

  if (dueTransactions.length === 0) {
    return { created: 0, emailsSent: 0 }
  }

  const orgIds = Array.from(new Set(dueTransactions.map((rt) => rt.organizationId)))
  const [organizations, allSettings] = await Promise.all([
    prisma.organization.findMany({
      where: { id: { in: orgIds } },
      include: {
        members: {
          where: { role: { in: ["owner", "admin"] } },
          include: { user: { select: { email: true } } },
        },
      },
    }),
    getSettingsBatch(orgIds),
  ])

  const orgMap = organizations.reduce((acc, org) => {
    acc[org.id] = org
    return acc
  }, {} as Record<string, (typeof organizations)[0]>)

  let created = 0
  let emailsSent = 0

  for (const rt of dueTransactions) {
    try {
      const org = orgMap[rt.organizationId]
      const emailSettings = allSettings[rt.organizationId] || {}

      // Create the actual transaction
      await prisma.transaction.create({
        data: {
          organizationId: rt.organizationId,
          userId: rt.userId,
          name: rt.name,
          description: rt.description,
          merchant: rt.merchant,
          total: rt.total,
          currencyCode: rt.currencyCode,
          type: rt.type,
          categoryCode: rt.categoryCode,
          projectCode: rt.projectCode,
          bankAccountId: rt.bankAccountId,
          chartAccountId: rt.chartAccountId,
          note: rt.note ? `[Recurring] ${rt.note}` : "[Recurring]",
          issuedAt: now,
        },
      })

      // Calculate next run date
      const nextRunAt = calculateNextDate(rt.nextRunAt, rt.recurrence)
      const shouldDeactivate = rt.endAt && nextRunAt > rt.endAt

      await prisma.recurringTransaction.update({
        where: { id: rt.id },
        data: {
          lastRunAt: now,
          nextRunAt,
          isActive: !shouldDeactivate,
        },
      })

      created++

      // Send bill recurring notification to org admins
      if (org) {
        const adminEmails = org.members.map((m) => m.user.email)

        for (const adminEmail of adminEmails) {
          try {
            await sendBillRecurringEmail({
              email: adminEmail,
              billName: rt.name,
              total: rt.total ? (rt.total / 100).toFixed(2) : "0.00",
              currency: rt.currencyCode || org.baseCurrency,
              recurrence: rt.recurrence,
              orgName: org.name,
              emailSettings,
            })
            emailsSent++
          } catch (emailError) {
            console.error(`Failed to send recurring email to ${adminEmail}:`, emailError)
          }
        }
      }
    } catch (error) {
      console.error(`Failed to process recurring transaction ${rt.id}:`, error)
    }
  }

  return { created, emailsSent }
}

function calculateNextDate(current: Date, recurrence: string): Date {
  switch (recurrence) {
    case "daily": return addDays(current, 1)
    case "weekly": return addWeeks(current, 1)
    case "monthly": return addMonths(current, 1)
    case "yearly": return addYears(current, 1)
    default: return addMonths(current, 1)
  }
}

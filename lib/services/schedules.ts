import { prisma } from "@/lib/core/db"
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns"
import { cache } from "react"

export type ScheduleModule = "invoice" | "bill" | "transaction" | "reminder" | "social_post"

export interface CreateScheduleInput {
  module: ScheduleModule
  name: string
  frequency: string
  interval?: number
  startAt: Date
  limitBy?: string | null
  limitCount?: number | null
  limitDate?: Date | null
  autoSend?: boolean
  templateData: Record<string, any>
}

// ── Queries ─────────────────────────────────────────────────────────────────

export const getSchedules = cache(async (orgId: string) => {
  return await prisma.schedule.findMany({
    where: { organizationId: orgId },
    orderBy: { nextRunAt: "asc" },
  })
})

export const getSchedulesByModule = cache(async (orgId: string, module: ScheduleModule) => {
  return await prisma.schedule.findMany({
    where: { organizationId: orgId, module },
    orderBy: { nextRunAt: "asc" },
  })
})

export const getActiveSchedules = cache(async (orgId: string) => {
  return await prisma.schedule.findMany({
    where: { organizationId: orgId, status: "active" },
    orderBy: { nextRunAt: "asc" },
  })
})

export async function getScheduleById(id: string, orgId: string) {
  return await prisma.schedule.findFirst({
    where: { id, organizationId: orgId },
  })
}

// ── Mutations ───────────────────────────────────────────────────────────────

export async function createSchedule(orgId: string, userId: string, data: CreateScheduleInput) {
  return await prisma.schedule.create({
    data: {
      organizationId: orgId,
      createdById: userId,
      module: data.module,
      name: data.name,
      frequency: data.frequency,
      interval: data.interval || 1,
      startAt: data.startAt,
      nextRunAt: data.startAt,
      limitBy: data.limitBy || null,
      limitCount: data.limitCount || null,
      limitDate: data.limitDate || null,
      autoSend: data.autoSend || false,
      templateData: data.templateData,
    },
  })
}

export async function updateSchedule(id: string, orgId: string, data: Partial<CreateScheduleInput>) {
  return await prisma.schedule.update({
    where: { id, organizationId: orgId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.frequency !== undefined ? { frequency: data.frequency } : {}),
      ...(data.interval !== undefined ? { interval: data.interval } : {}),
      ...(data.limitBy !== undefined ? { limitBy: data.limitBy } : {}),
      ...(data.limitCount !== undefined ? { limitCount: data.limitCount } : {}),
      ...(data.limitDate !== undefined ? { limitDate: data.limitDate } : {}),
      ...(data.autoSend !== undefined ? { autoSend: data.autoSend } : {}),
      ...(data.templateData !== undefined ? { templateData: data.templateData } : {}),
    },
  })
}

export async function pauseSchedule(id: string, orgId: string) {
  return await prisma.schedule.update({
    where: { id, organizationId: orgId },
    data: { status: "paused" },
  })
}

export async function resumeSchedule(id: string, orgId: string) {
  const schedule = await prisma.schedule.findFirst({ where: { id, organizationId: orgId } })
  if (!schedule) throw new Error("Schedule not found")

  // Recalculate next run if it's in the past
  let nextRunAt = schedule.nextRunAt
  const now = new Date()
  while (nextRunAt <= now) {
    nextRunAt = calculateNextDate(nextRunAt, schedule.frequency, schedule.interval)
  }

  return await prisma.schedule.update({
    where: { id },
    data: { status: "active", nextRunAt },
  })
}

export async function cancelSchedule(id: string, orgId: string) {
  return await prisma.schedule.update({
    where: { id, organizationId: orgId },
    data: { status: "cancelled" },
  })
}

export async function deleteSchedule(id: string, orgId: string) {
  return await prisma.schedule.delete({
    where: { id, organizationId: orgId },
  })
}

// ── Schedule Processing ─────────────────────────────────────────────────────

/**
 * Process all due schedules across all orgs. Called by cron.
 * Creates the appropriate item for each module and advances the schedule.
 */
export async function processDueSchedules(): Promise<{ processed: number; created: number; completed: number; errors: number }> {
  const now = new Date()

  const dueSchedules = await prisma.schedule.findMany({
    where: {
      status: "active",
      nextRunAt: { lte: now },
    },
    include: { organization: true },
  })

  let created = 0
  let completed = 0
  let errors = 0

  for (const schedule of dueSchedules) {
    try {
      const template = schedule.templateData as Record<string, any>

      // Create the item based on module
      switch (schedule.module) {
        case "invoice":
          await createScheduledInvoice(schedule.organizationId, template, schedule.autoSend)
          break
        case "bill":
          await createScheduledBill(schedule.organizationId, template)
          break
        case "transaction":
          await createScheduledTransaction(schedule.organizationId, schedule.createdById, template)
          break
        case "reminder":
          await createScheduledReminder(schedule.organizationId, schedule.createdById, template)
          break
        case "social_post":
          await createScheduledSocialPost(schedule.organizationId, schedule.createdById, template)
          break
      }

      created++

      // Advance the schedule
      const newRunCount = schedule.runCount + 1
      const nextRunAt = calculateNextDate(schedule.nextRunAt, schedule.frequency, schedule.interval)

      // Check if schedule should complete
      const shouldComplete =
        (schedule.limitBy === "count" && schedule.limitCount && newRunCount >= schedule.limitCount) ||
        (schedule.limitBy === "date" && schedule.limitDate && nextRunAt > schedule.limitDate)

      await prisma.schedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: now,
          nextRunAt,
          runCount: newRunCount,
          status: shouldComplete ? "completed" : "active",
        },
      })

      if (shouldComplete) completed++
    } catch (error) {
      console.error(`Failed to process schedule ${schedule.id}:`, error)
      errors++
    }
  }

  return { processed: dueSchedules.length, created, completed, errors }
}

// ── Module-specific creation ────────────────────────────────────────────────

async function createScheduledInvoice(orgId: string, template: Record<string, any>, autoSend: boolean) {
  const { getNextInvoiceNumber } = await import("@/lib/services/invoices")
  const { createInvoice } = await import("@/lib/services/invoices")

  const invoiceNumber = await getNextInvoiceNumber(orgId, template.type || "sales")
  const dueAt = template.dueInDays ? addDays(new Date(), template.dueInDays) : undefined

  const invoice = await createInvoice(orgId, {
    invoiceNumber,
    type: template.type || "sales",
    clientName: template.clientName,
    clientEmail: template.clientEmail,
    clientAddress: template.clientAddress,
    clientTaxId: template.clientTaxId,
    contactId: template.contactId,
    items: template.items,
    subtotal: template.subtotal || 0,
    taxTotal: template.taxTotal || 0,
    total: template.total || 0,
    currency: template.currency || "INR",
    issuedAt: new Date(),
    dueAt,
    notes: template.notes ? `[Recurring] ${template.notes}` : "[Recurring]",
  })

  if (autoSend && template.clientEmail) {
    try {
      const { sendInvoiceEmail } = await import("@/lib/integrations/email")
      const { getSettings } = await import("@/lib/services/settings")
      const emailSettings = await getSettings(orgId)
      const org = await prisma.organization.findUnique({ where: { id: orgId } })

      await sendInvoiceEmail({
        orgId,
        email: template.clientEmail,
        invoiceNumber,
        clientName: template.clientName,
        total: (template.total / 100).toFixed(2),
        currency: template.currency || "INR",
        dueDate: dueAt ? format(dueAt, "MMMM d, yyyy") : "Not specified",
        orgName: org?.name || "",
        notes: template.notes,
        emailSettings,
      })
    } catch (e) {
      console.error("Failed to auto-send recurring invoice email:", e)
    }
  }
}

async function createScheduledBill(orgId: string, template: Record<string, any>) {
  const { createBill, getNextBillNumber } = await import("@/lib/services/bills")

  const billNumber = await getNextBillNumber(orgId)
  const dueAt = template.dueInDays ? addDays(new Date(), template.dueInDays) : undefined

  await createBill(orgId, {
    billNumber,
    vendorName: template.vendorName,
    vendorEmail: template.vendorEmail,
    vendorAddress: template.vendorAddress,
    vendorTaxId: template.vendorTaxId,
    contactId: template.contactId,
    subtotal: template.subtotal || 0,
    taxTotal: template.taxTotal || 0,
    total: template.total || 0,
    currency: template.currency || "INR",
    issuedAt: new Date(),
    dueAt,
    notes: template.notes ? `[Recurring] ${template.notes}` : "[Recurring]",
  })
}

async function createScheduledTransaction(orgId: string, userId: string, template: Record<string, any>) {
  const { autoAssignCOA } = await import("@/lib/services/automation")
  const chartAccountId = await autoAssignCOA(orgId, template.categoryCode || null, template.type || "expense")

  await prisma.transaction.create({
    data: {
      organizationId: orgId,
      userId,
      name: template.name,
      description: template.description,
      merchant: template.merchant,
      total: template.total,
      currencyCode: template.currencyCode,
      type: template.type || "expense",
      categoryCode: template.categoryCode,
      projectCode: template.projectCode,
      bankAccountId: template.bankAccountId,
      chartAccountId,
      note: template.note ? `[Recurring] ${template.note}` : "[Recurring]",
      issuedAt: new Date(),
    },
  })
}

async function createScheduledReminder(orgId: string, userId: string, template: Record<string, any>) {
  const { createReminder } = await import("@/lib/services/reminders")

  await createReminder(orgId, userId, {
    title: template.title,
    description: template.description,
    dueAt: addDays(new Date(), template.dueInDays || 0),
    category: template.category || "custom",
    priority: template.priority || "medium",
    recurrence: "one_time",
    emailNotify: template.emailNotify ?? true,
    emailNotifyMinutesBefore: template.emailNotifyMinutesBefore || 60,
    assigneeUserIds: template.assigneeIds || [],
  })
}

async function createScheduledSocialPost(orgId: string, userId: string, template: Record<string, any>) {
  const { createMultiPlatformPost } = await import("@/lib/services/social-posts")

  await createMultiPlatformPost(
    orgId,
    userId,
    {
      content: template.content,
      contentType: template.contentType || "post",
      title: template.title,
      tags: template.tags || [],
      status: "queued",
      scheduledAt: new Date(),
      settings: template.settings,
    },
    template.socialAccountIds || []
  )
}

// ── Date calculation ────────────────────────────────────────────────────────

function calculateNextDate(current: Date, frequency: string, interval: number): Date {
  switch (frequency) {
    case "daily": return addDays(current, interval)
    case "weekly": return addWeeks(current, interval)
    case "monthly": return addMonths(current, interval)
    case "yearly": return addYears(current, interval)
    default: return addMonths(current, interval)
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getFrequencyLabel(frequency: string, interval: number): string {
  if (interval === 1) {
    const labels: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" }
    return labels[frequency] || frequency
  }
  const units: Record<string, string> = { daily: "days", weekly: "weeks", monthly: "months", yearly: "years" }
  return `Every ${interval} ${units[frequency] || frequency}`
}

export function getModuleLabel(module: string): string {
  const labels: Record<string, string> = {
    invoice: "Invoice", bill: "Bill", transaction: "Transaction",
    reminder: "Reminder", social_post: "Social post",
  }
  return labels[module] || module
}

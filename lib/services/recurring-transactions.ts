"use server"

import { prisma } from "@/lib/core/db"
import { autoAssignCOA } from "./automation"
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
 * Called by the cron job.
 */
export async function processDueRecurringTransactions(): Promise<number> {
  const now = new Date()

  const dueTransactions = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
      OR: [
        { endAt: null },
        { endAt: { gte: now } },
      ],
    },
  })

  let created = 0

  for (const rt of dueTransactions) {
    try {
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
    } catch (error) {
      console.error(`Failed to process recurring transaction ${rt.id}:`, error)
    }
  }

  return created
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

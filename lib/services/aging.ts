import { prisma } from "@/lib/core/db"
import { cache } from "react"
import { differenceInDays, isAfter, isBefore, endOfDay } from "date-fns"

export type AgingCategory = {
  label: string
  amount: number
  count: number
}

export type AgingStats = {
  receivables: AgingCategory[]
  payables: AgingCategory[]
}

const CATEGORIES = [
  { label: "Coming Due", min: -Infinity, max: 0 },
  { label: "1-30 days overdue", min: 1, max: 30 },
  { label: "31-60 days overdue", min: 31, max: 60 },
  { label: "61-90 days overdue", min: 61, max: 90 },
  { label: "> 90 days overdue", min: 91, max: Infinity },
]

export const getAgingStats = cache(async (orgId: string): Promise<AgingStats> => {
  const now = endOfDay(new Date())

  // Get all unpaid invoices and bills
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["sent", "overdue", "partial", "draft"] },
      type: { in: ["sale", "purchase"] },
    },
  })

  const receivables = CATEGORIES.map((cat) => ({ ...cat, amount: 0, count: 0 }))
  const payables = CATEGORIES.map((cat) => ({ ...cat, amount: 0, count: 0 }))

  invoices.forEach((invoice) => {
    if (!invoice.dueAt) return

    const daysOverdue = isAfter(now, invoice.dueAt) 
      ? differenceInDays(now, invoice.dueAt)
      : differenceInDays(now, invoice.dueAt) // This will be negative if not overdue

    const targetList = invoice.type === "sale" ? receivables : payables
    
    const categoryIndex = CATEGORIES.findIndex(
      (cat) => daysOverdue >= cat.min && daysOverdue <= cat.max
    )

    if (categoryIndex !== -1) {
      targetList[categoryIndex].amount += Number(invoice.total || 0)
      targetList[categoryIndex].count += 1
    }
  })

  return {
    receivables: receivables.map(({ label, amount, count }) => ({ label, amount, count })),
    payables: payables.map(({ label, amount, count }) => ({ label, amount, count })),
  }
})

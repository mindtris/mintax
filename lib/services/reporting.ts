import { prisma } from "@/lib/core/db"
import { cache } from "react"
import { differenceInDays, isAfter, endOfDay } from "date-fns"
import { TransactionFilters } from "./transactions"
import { calcTotalPerCurrency } from "@/lib/stats"

/** 
 * Centralized & Polymorphic Reporting Service for Mintax.
 */

// --- Types ---

export type ReportType = 
  | "accounts-aging" 
  | "accounts-summary" 
  | "accounts-fiscal-comparison"
  | "sales-status" 
  | "hire-metrics" 
  | "engage-metrics"

export type AgingCategory = {
  label: string
  amount: number
  count: number
}

export type AgingReport = {
  receivables: AgingCategory[]
  payables: AgingCategory[]
}

export type AccountsSummary = {
  income: Record<string, number>
  expenses: Record<string, number>
}

export type FiscalYearComparison = {
  previous: { income: number; expense: number; net: number; label: string }
  current: { income: number; expense: number; net: number; label: string }
}

export type ReportResult = AgingReport | AccountsSummary | FiscalYearComparison | any

const AGING_CATEGORIES = [
  { label: "Coming Due", min: -Infinity, max: 0 },
  { label: "1-30 days overdue", min: 1, max: 30 },
  { label: "31-60 days overdue", min: 31, max: 60 },
  { label: "61-90 days overdue", min: 61, max: 90 },
  { label: "> 90 days overdue", min: 91, max: Infinity },
]

// --- Polymorphic Dispatcher ---

export const getReport = cache(async <T = ReportResult>(
  type: ReportType, 
  orgId: string, 
  filters: TransactionFilters = {}
): Promise<T> => {
  switch (type) {
    case "accounts-aging":
      return (await getAgingReport(orgId)) as T
    case "accounts-summary":
      return (await getAccountsSummary(orgId, filters)) as T
    case "accounts-fiscal-comparison":
      return (await getFiscalYearComparison(orgId)) as T
    case "sales-status":
      return (await getSalesSummary(orgId)) as T
    case "hire-metrics":
      return (await getHireMetrics(orgId)) as T
    case "engage-metrics":
      return (await getEngagementMetrics(orgId)) as T
    default:
      throw new Error(`Unsupported report type: ${type}`)
  }
})

// --- Implementation Handlers (Internal) ---

async function getFiscalYearComparison(orgId: string): Promise<FiscalYearComparison> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { fiscalYearStart: true }
  })
  
  const fyStartMonth = (org?.fiscalYearStart || 1) - 1 // 0-indexed
  const now = new Date()
  let currentFyStart = new Date(now.getFullYear(), fyStartMonth, 1)
  
  if (now < currentFyStart) {
    currentFyStart.setFullYear(now.getFullYear() - 1)
  }
  
  const currentFyEnd = new Date(currentFyStart)
  currentFyEnd.setFullYear(currentFyStart.getFullYear() + 1)
  currentFyEnd.setMilliseconds(-1)
  
  const previousFyStart = new Date(currentFyStart)
  previousFyStart.setFullYear(currentFyStart.getFullYear() - 1)
  
  const previousFyEnd = new Date(currentFyStart)
  previousFyEnd.setMilliseconds(-1)

  const [currentStats, previousStats] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { organizationId: orgId, issuedAt: { gte: currentFyStart, lte: currentFyEnd } },
      _sum: { total: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { organizationId: orgId, issuedAt: { gte: previousFyStart, lte: previousFyEnd } },
      _sum: { total: true },
    }),
  ])

  const calc = (stats: any[]) => {
    const income = stats.find((s) => s.type === "income")?._sum.total || 0
    const expense = stats.find((s) => s.type === "expense")?._sum.total || 0
    return { income, expense, net: income - expense }
  }

  const formatFYLabel = (start: Date) => `FY ${start.getFullYear()}-${(start.getFullYear() + 1).toString().slice(-2)}`

  return {
    previous: { ...calc(previousStats), label: formatFYLabel(previousFyStart) },
    current: { ...calc(currentStats), label: formatFYLabel(currentFyStart) }
  }
}

async function getAgingReport(orgId: string): Promise<AgingReport> {
  const now = endOfDay(new Date())
  
  const [invoices, bills] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["sent", "overdue", "partial", "draft"] },
        type: "sale",
      },
    }),
    prisma.bill.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["pending", "overdue", "draft"] },
      },
    })
  ])
  
  const receivables = AGING_CATEGORIES.map(cat => ({ ...cat, amount: 0, count: 0 }))
  const payables = AGING_CATEGORIES.map(cat => ({ ...cat, amount: 0, count: 0 }))
  
  // Process Receivables (Invoices)
  invoices.forEach((invoice) => {
    if (!invoice.dueAt) return
    const daysOverdue = isAfter(now, invoice.dueAt) 
      ? differenceInDays(now, invoice.dueAt)
      : differenceInDays(now, invoice.dueAt) 
      
    const categoryIndex = AGING_CATEGORIES.findIndex(cat => daysOverdue >= cat.min && daysOverdue <= cat.max)
    if (categoryIndex !== -1) {
      receivables[categoryIndex].amount += Number(invoice.total || 0)
      receivables[categoryIndex].count += 1
    }
  })
  
  // Process Payables (Bills)
  bills.forEach((bill) => {
    if (!bill.dueAt) return
    const daysOverdue = isAfter(now, bill.dueAt) 
      ? differenceInDays(now, bill.dueAt)
      : differenceInDays(now, bill.dueAt) 
      
    const categoryIndex = AGING_CATEGORIES.findIndex(cat => daysOverdue >= cat.min && daysOverdue <= cat.max)
    if (categoryIndex !== -1) {
      payables[categoryIndex].amount += Number(bill.total || 0)
      payables[categoryIndex].count += 1
    }
  })
  
  return {
    receivables: receivables.map(({ label, amount, count }) => ({ label, amount, count })),
    payables: payables.map(({ label, amount, count }) => ({ label, amount, count })),
  }
}

async function getAccountsSummary(orgId: string, filters: TransactionFilters) {
  const where: any = { organizationId: orgId }
  if (filters.dateFrom || filters.dateTo) {
    where.issuedAt = {
      gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
    }
  }

  const transactions = await prisma.transaction.findMany({ where })
  return {
    income: calcTotalPerCurrency(transactions.filter(t => t.type === "income")),
    expenses: calcTotalPerCurrency(transactions.filter(t => t.type === "expense")),
  }
}

async function getSalesSummary(orgId: string) {
  return await prisma.invoice.groupBy({
    by: ['status'],
    where: { organizationId: orgId, type: "sale" },
    _count: true,
    _sum: { total: true }
  })
}

async function getHireMetrics(orgId: string) {
  return { activeJobs: 0, totalCandidates: 0, hiresThisMonth: 0 }
}

async function getEngagementMetrics(orgId: string) {
  return { activeMembers: 0, averagePulseScore: 0, feedbackPending: 0 }
}

import { prisma } from "@/lib/core/db"

/**
 * COA auto-assignment: Maps category types to default chart account codes.
 * When a transaction has a category but no chartAccountId, we auto-assign.
 */
const CATEGORY_TO_COA_MAP: Record<string, string> = {
  // Expense categories → 5xxx expense accounts
  expense: "5900",       // Other Expenses (fallback)
  ads: "5500",           // Travel & Entertainment (marketing)
  salary: "5100",        // Salaries & Wages
  rent: "5200",          // Rent
  utilities: "5300",     // Utilities
  office: "5400",        // Office Supplies
  travel: "5500",        // Travel & Entertainment
  insurance: "5700",     // Insurance
  fees: "5600",          // Professional Fees
  software: "5400",      // Office Supplies (software)
  // Income categories → 4xxx revenue accounts
  income: "4300",        // Other Income (fallback)
  sales_revenue: "4000", // Sales Revenue
  service_revenue: "4100", // Service Revenue
  interest_income: "4200", // Interest Income
  // COGS → 5000
  cogs: "5000",          // Cost of Goods Sold
}

/**
 * Auto-assign COA to a transaction based on its category.
 * Returns the chartAccountId if found, null otherwise.
 */
export async function autoAssignCOA(orgId: string, categoryCode: string | null, transactionType: string | null): Promise<string | null> {
  if (!categoryCode && !transactionType) return null

  // Try exact category code match first
  let coaCode = categoryCode ? CATEGORY_TO_COA_MAP[categoryCode] : null

  // Fallback to type-based mapping
  if (!coaCode && transactionType) {
    coaCode = transactionType === "income" ? "4300" : "5900"
  }

  if (!coaCode) return null

  const account = await prisma.chartAccount.findFirst({
    where: { organizationId: orgId, code: coaCode },
    select: { id: true },
  })

  return account?.id || null
}

/**
 * Check if AI analysis result has enough confidence to auto-accept.
 * Requires: name, total, and at least one of (merchant, categoryCode, issuedAt).
 */
export function isHighConfidenceResult(parsed: Record<string, any>): boolean {
  const hasName = !!parsed.name && parsed.name.trim().length > 0
  const hasTotal = !!parsed.total && !isNaN(parseFloat(parsed.total))
  const hasMerchant = !!parsed.merchant && parsed.merchant.trim().length > 0
  const hasCategory = !!parsed.categoryCode && parsed.categoryCode.trim().length > 0
  const hasDate = !!parsed.issuedAt

  // Must have name + total + at least 2 of (merchant, category, date)
  const extraFields = [hasMerchant, hasCategory, hasDate].filter(Boolean).length
  return hasName && hasTotal && extraFields >= 2
}

/**
 * Auto-create transaction from invoice when marked as paid.
 */
export async function createTransactionFromInvoice(
  orgId: string,
  userId: string,
  invoice: {
    id: string
    invoiceNumber: string
    clientName: string
    total: number
    currency: string
    type: string
    issuedAt: Date | null
    notes: string | null
    contactId: string | null
  }
) {
  const isIncome = invoice.type === "sales"
  const type = isIncome ? "income" : "expense"

  // Auto-assign COA
  const chartAccountId = await autoAssignCOA(
    orgId,
    isIncome ? "sales_revenue" : null,
    type
  )

  const transaction = await prisma.transaction.create({
    data: {
      organizationId: orgId,
      userId,
      name: `${isIncome ? "Invoice" : "Purchase"} #${invoice.invoiceNumber}`,
      merchant: invoice.clientName,
      total: invoice.total,
      currencyCode: invoice.currency,
      type,
      issuedAt: invoice.issuedAt || new Date(),
      note: invoice.notes || undefined,
      chartAccountId,
      invoiceId: invoice.id,
    },
  })

  return transaction
}

/**
 * Auto-create transaction from bill when marked as paid.
 */
export async function createTransactionFromBill(
  orgId: string,
  userId: string,
  bill: {
    id: string
    billNumber: string
    vendorName: string
    total: number
    currency: string
    issuedAt: Date | null
    notes: string | null
  }
) {
  const chartAccountId = await autoAssignCOA(orgId, null, "expense")

  const transaction = await prisma.transaction.create({
    data: {
      organizationId: orgId,
      userId,
      name: `Bill #${bill.billNumber}`,
      merchant: bill.vendorName,
      total: bill.total,
      currencyCode: bill.currency,
      type: "expense",
      issuedAt: bill.issuedAt || new Date(),
      note: bill.notes || undefined,
      chartAccountId,
    },
  })

  return transaction
}

/**
 * Batch reconcile all high-confidence matches for a bank account.
 * Returns the number of matches applied.
 */
export async function batchReconcile(orgId: string, accountId: string, minConfidence: number = 80): Promise<number> {
  // Import inline to avoid circular deps
  const { getAutoMatchSuggestions, matchEntry } = await import("./reconciliation")

  const suggestions = await getAutoMatchSuggestions(orgId, accountId)
  const highConfidence = suggestions.filter((s) => s.confidence >= minConfidence)

  let matched = 0
  for (const suggestion of highConfidence) {
    try {
      await matchEntry(suggestion.entryId, suggestion.transactionId)
      matched++
    } catch {
      // Skip if already matched or conflict
    }
  }

  return matched
}

/**
 * Parse CSV bank statement content into entries.
 * Supports common formats: date, description, amount, balance (optional).
 */
export function parseCSVBankStatement(csvContent: string): Array<{
  date: Date
  description: string
  amount: number
  balance?: number
  reference?: string
}> {
  const lines = csvContent.trim().split("\n")
  if (lines.length < 2) return []

  // Detect header
  const header = lines[0].toLowerCase()
  const rows = lines.slice(1)

  // Try to detect column positions
  const headers = header.split(",").map((h) => h.trim().replace(/"/g, ""))

  const dateIdx = headers.findIndex((h) => /date|posted|trans/.test(h))
  const descIdx = headers.findIndex((h) => /desc|narr|detail|memo|payee/.test(h))
  const amountIdx = headers.findIndex((h) => /amount|sum|value/.test(h))
  const debitIdx = headers.findIndex((h) => /debit|withdrawal|dr/.test(h))
  const creditIdx = headers.findIndex((h) => /credit|deposit|cr/.test(h))
  const balanceIdx = headers.findIndex((h) => /balance|bal/.test(h))
  const refIdx = headers.findIndex((h) => /ref|check|cheque|number/.test(h))

  if (dateIdx === -1 || descIdx === -1) {
    // Fallback: assume date, description, amount
    return rows.filter(Boolean).map((row) => {
      const cols = parseCSVRow(row)
      return {
        date: parseDate(cols[0]),
        description: cols[1] || "Unknown",
        amount: parseAmount(cols[2]),
        balance: cols[3] ? parseAmount(cols[3]) : undefined,
      }
    }).filter((e) => !isNaN(e.date.getTime()))
  }

  return rows.filter(Boolean).map((row) => {
    const cols = parseCSVRow(row)

    let amount: number
    if (amountIdx >= 0) {
      amount = parseAmount(cols[amountIdx])
    } else if (debitIdx >= 0 && creditIdx >= 0) {
      const debit = parseAmount(cols[debitIdx])
      const credit = parseAmount(cols[creditIdx])
      amount = credit > 0 ? credit : -debit
    } else {
      amount = 0
    }

    return {
      date: parseDate(cols[dateIdx]),
      description: cols[descIdx] || "Unknown",
      amount: Math.round(amount * 100), // Convert to cents
      balance: balanceIdx >= 0 ? Math.round(parseAmount(cols[balanceIdx]) * 100) : undefined,
      reference: refIdx >= 0 ? cols[refIdx] || undefined : undefined,
    }
  }).filter((e) => !isNaN(e.date.getTime()))
}

function parseCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseDate(str: string): Date {
  if (!str) return new Date(NaN)
  const cleaned = str.replace(/"/g, "").trim()
  // Try multiple formats
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return d

  // Try DD/MM/YYYY
  const parts = cleaned.split(/[\/\-.]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number)
    if (c > 100) return new Date(c, b - 1, a) // DD/MM/YYYY
    if (a > 100) return new Date(a, b - 1, c) // YYYY/MM/DD
  }
  return new Date(NaN)
}

function parseAmount(str: string): number {
  if (!str) return 0
  const cleaned = str.replace(/"/g, "").replace(/[^0-9.\-+]/g, "").trim()
  return parseFloat(cleaned) || 0
}

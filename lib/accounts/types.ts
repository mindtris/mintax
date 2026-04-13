/**
 * Wave-style account type hierarchy for BankAccount records.
 *
 * Top-level category drives the grouping in dropdowns and reports.
 * Subtype is what gets stored in BankAccount.accountType.
 *
 * Legacy values (checking, savings, cash, wallet) are kept for backward
 * compatibility with existing records — they render under "Cash and Bank".
 */

export type AccountCategory = "asset" | "liability" | "equity"

export type AccountSubtype = {
  /** Value stored in BankAccount.accountType */
  code: string
  /** Human-readable label */
  label: string
  /** Top-level category */
  category: AccountCategory
  /** True if this is a legacy value kept only for existing records */
  legacy?: boolean
}

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
}

export const ACCOUNT_SUBTYPES: AccountSubtype[] = [
  // ── Asset ──────────────────────────────────────────────
  { code: "cash_and_bank", label: "Cash and Bank", category: "asset" },
  { code: "money_in_transit", label: "Money in Transit", category: "asset" },
  { code: "accounts_receivable", label: "Accounts Receivable", category: "asset" },
  { code: "inventory", label: "Inventory", category: "asset" },
  { code: "other_asset", label: "Other Asset", category: "asset" },
  // Legacy — still used by existing records, all collapse to "Cash and Bank" visually
  { code: "checking", label: "Cash and Bank", category: "asset", legacy: true },
  { code: "savings", label: "Cash and Bank", category: "asset", legacy: true },
  { code: "cash", label: "Cash and Bank", category: "asset", legacy: true },
  { code: "wallet", label: "Cash and Bank", category: "asset", legacy: true },

  // ── Liability ──────────────────────────────────────────
  { code: "credit_card", label: "Credit Card", category: "liability" },
  { code: "loan", label: "Loan and Line of Credit", category: "liability" },
  { code: "accounts_payable", label: "Accounts Payable", category: "liability" },
  { code: "customer_prepayments", label: "Customer Prepayments", category: "liability" },
  { code: "other_liability", label: "Other Liability", category: "liability" },

  // ── Equity ─────────────────────────────────────────────
  { code: "owner_contribution", label: "Owner's Contribution / Drawings", category: "equity" },
  { code: "retained_earnings", label: "Retained Earnings", category: "equity" },
]

/** Only the values users should see when creating a NEW account (no legacy) */
export const ACCOUNT_SUBTYPES_SELECTABLE = ACCOUNT_SUBTYPES.filter((s) => !s.legacy)

/**
 * Resolve a stored subtype code (including legacy values) to its category.
 * Falls back to "asset" for unknown codes so existing data stays visible.
 */
export function getAccountCategory(subtypeCode: string | null | undefined): AccountCategory {
  if (!subtypeCode) return "asset"
  return ACCOUNT_SUBTYPES.find((s) => s.code === subtypeCode)?.category || "asset"
}

/**
 * Resolve a stored subtype code to a display label. Legacy values collapse
 * to their canonical label (e.g. "checking" → "Cash and Bank").
 */
export function getAccountSubtypeLabel(subtypeCode: string | null | undefined): string {
  if (!subtypeCode) return "Other"
  return ACCOUNT_SUBTYPES.find((s) => s.code === subtypeCode)?.label || subtypeCode
}

/** Group selectable subtypes by category for use in a 2-level picker */
export function getGroupedSubtypes() {
  const groups: Record<AccountCategory, AccountSubtype[]> = {
    asset: [],
    liability: [],
    equity: [],
  }
  for (const s of ACCOUNT_SUBTYPES_SELECTABLE) {
    groups[s.category].push(s)
  }
  return groups
}

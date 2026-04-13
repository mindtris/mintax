/**
 * Maps Plaid `personal_finance_category.primary` values to the default
 * Category codes seeded by createOrgDefaults (lib/services/defaults.ts).
 *
 * Plaid PFC reference:
 * https://plaid.com/docs/api/products/transactions/#categories
 *
 * The mapping is best-effort. If an org has customized their Category codes
 * and the target code no longer exists, sync leaves categoryCode null.
 */
export const PLAID_PFC_TO_CATEGORY_CODE: Record<string, string> = {
  // Expenses
  BANK_FEES: "bank_fees",
  ENTERTAINMENT: "entertainment",
  FOOD_AND_DRINK: "food",
  GENERAL_MERCHANDISE: "office_supplies",
  GENERAL_SERVICES: "professional_fees",
  GOVERNMENT_AND_NON_PROFIT: "tax_payments",
  HOME_IMPROVEMENT: "repairs_maintenance",
  LOAN_PAYMENTS: "interest",
  MEDICAL: "healthcare",
  PERSONAL_CARE: "personal_care",
  RENT_AND_UTILITIES: "utilities",
  TRANSPORTATION: "auto_vehicle",
  TRAVEL: "travel",

  // Income
  INCOME: "salary_income",

  // Transfers do not map to a category (they aren't P&L events)
  TRANSFER_IN: "",
  TRANSFER_OUT: "",
}

export function mapPlaidCategory(primary: string | null | undefined): string | null {
  if (!primary) return null
  const code = PLAID_PFC_TO_CATEGORY_CODE[primary]
  return code ? code : null
}

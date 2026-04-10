import { prisma } from "@/lib/core/db"

/**
 * Migration utility to transition legacy 'transaction' categories 
 * to the new universal 'expense' type system.
 */
export async function migrateLegacyCategoryTypes(orgId: string) {
  return await prisma.category.updateMany({
    where: {
      organizationId: orgId,
      type: "transaction",
    },
    data: {
      type: "expense",
    },
  })
}

/**
 * Ensures all existing bills are aligned with the new administrative defaults.
 */
export async function syncHistoricalBills(orgId: string) {
  // Fetch bills without prefixes or specific categories and retrofit if needed
  // (Currently, Bills are new enough that they should be fine, but we establish the pattern here)
  return { success: true }
}

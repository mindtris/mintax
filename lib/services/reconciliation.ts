"use server"

import { prisma } from "@/lib/core/db"
import { cache } from "react"

export type MatchSuggestion = {
  entryId: string
  transactionId: string
  confidence: number
  reason: string
}

export const getUnmatchedEntries = cache(async (accountId: string) => {
  return await prisma.bankEntry.findMany({
    where: {
      statement: { bankAccountId: accountId },
      status: "unmatched",
    },
    orderBy: { date: "desc" },
  })
})

export const getUnreconciledTransactions = cache(async (orgId: string, accountId: string) => {
  return await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      bankAccountId: accountId,
      reconciled: false,
    },
    orderBy: { issuedAt: "desc" },
    take: 200,
  })
})

export async function matchEntry(entryId: string, transactionId: string, userId?: string) {
  await prisma.bankEntry.update({
    where: { id: entryId },
    data: { transactionId, status: "matched" },
  })

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      reconciled: true,
      reconciledAt: new Date(),
      reconciledBy: userId || null,
    },
  })
}

export async function unmatchEntry(entryId: string) {
  const entry = await prisma.bankEntry.findUnique({ where: { id: entryId } })
  if (!entry) return

  await prisma.bankEntry.update({
    where: { id: entryId },
    data: { transactionId: null, status: "unmatched" },
  })

  if (entry.transactionId) {
    await prisma.transaction.update({
      where: { id: entry.transactionId },
      data: { reconciled: false, reconciledAt: null, reconciledBy: null },
    })
  }
}

export async function excludeEntry(entryId: string) {
  await prisma.bankEntry.update({
    where: { id: entryId },
    data: { status: "excluded" },
  })
}

export async function getAutoMatchSuggestions(orgId: string, accountId: string): Promise<MatchSuggestion[]> {
  const entries = await getUnmatchedEntries(accountId)
  const transactions = await getUnreconciledTransactions(orgId, accountId)

  if (entries.length === 0 || transactions.length === 0) return []

  const suggestions: MatchSuggestion[] = []

  for (const entry of entries) {
    let bestMatch: MatchSuggestion | null = null

    for (const txn of transactions) {
      let confidence = 0
      const reasons: string[] = []

      // Amount match (most important — exact match within 1 cent)
      const entryAmount = Math.abs(entry.amount)
      const txnAmount = Math.abs(txn.total || 0)
      if (entryAmount > 0 && txnAmount > 0) {
        const amountDiff = Math.abs(entryAmount - txnAmount)
        if (amountDiff === 0) {
          confidence += 50
          reasons.push("Exact amount match")
        } else if (amountDiff <= 1) {
          confidence += 45
          reasons.push("Amount match (within 1 cent)")
        } else if (amountDiff <= entryAmount * 0.01) {
          confidence += 30
          reasons.push("Amount within 1%")
        }
      }

      // Date proximity
      if (txn.issuedAt && entry.date) {
        const daysDiff = Math.abs(
          (new Date(txn.issuedAt).getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysDiff === 0) {
          confidence += 30
          reasons.push("Same day")
        } else if (daysDiff <= 1) {
          confidence += 25
          reasons.push("Within 1 day")
        } else if (daysDiff <= 3) {
          confidence += 15
          reasons.push("Within 3 days")
        } else if (daysDiff <= 7) {
          confidence += 5
          reasons.push("Within 7 days")
        }
      }

      // Description similarity (simple substring matching)
      const entryDesc = (entry.description || "").toLowerCase()
      const txnName = (txn.name || "").toLowerCase()
      const txnMerchant = (txn.merchant || "").toLowerCase()

      if (entryDesc && txnMerchant && (entryDesc.includes(txnMerchant) || txnMerchant.includes(entryDesc))) {
        confidence += 20
        reasons.push("Merchant name match")
      } else if (entryDesc && txnName && (entryDesc.includes(txnName) || txnName.includes(entryDesc))) {
        confidence += 10
        reasons.push("Description match")
      }

      if (confidence > (bestMatch?.confidence || 0)) {
        bestMatch = {
          entryId: entry.id,
          transactionId: txn.id,
          confidence,
          reason: reasons.join(", "),
        }
      }
    }

    // Only suggest if confidence is high enough
    if (bestMatch && bestMatch.confidence >= 50) {
      suggestions.push(bestMatch)
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

export async function getReconciliationStats(accountId: string) {
  const [unmatched, matched, reconciled, excluded] = await Promise.all([
    prisma.bankEntry.count({ where: { statement: { bankAccountId: accountId }, status: "unmatched" } }),
    prisma.bankEntry.count({ where: { statement: { bankAccountId: accountId }, status: "matched" } }),
    prisma.bankEntry.count({ where: { statement: { bankAccountId: accountId }, status: "reconciled" } }),
    prisma.bankEntry.count({ where: { statement: { bankAccountId: accountId }, status: "excluded" } }),
  ])

  return { unmatched, matched, reconciled, excluded, total: unmatched + matched + reconciled + excluded }
}

/**
 * Discrepancy report:
 *   - bankOnly: bank statement entries with no matching book transaction
 *   - booksOnly: book transactions for this account with no matching bank entry
 *   - balance: difference between book balance and bank statement closing balance
 */
export async function getDiscrepancyReport(orgId: string, accountId: string) {
  const [bankOnly, booksOnly, account] = await Promise.all([
    prisma.bankEntry.findMany({
      where: { statement: { bankAccountId: accountId }, status: "unmatched" },
      orderBy: { date: "desc" },
    }),
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        bankAccountId: accountId,
        reconciled: false,
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.bankAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        name: true,
        currency: true,
        currentBalance: true,
      },
    }),
  ])

  // Sum unmatched bank entries (in cents)
  const bankOnlyTotal = bankOnly.reduce((sum, e) => sum + (e.amount || 0), 0)
  // Sum unreconciled book entries (in cents)
  const booksOnlyTotal = booksOnly.reduce((sum, t) => {
    const amount = t.total || 0
    return sum + (t.type === "income" ? amount : -amount)
  }, 0)

  return {
    account,
    bankOnly,
    booksOnly,
    bankOnlyTotal,
    booksOnlyTotal,
    discrepancy: bankOnlyTotal - booksOnlyTotal,
  }
}

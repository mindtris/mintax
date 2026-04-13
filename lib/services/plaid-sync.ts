import { prisma } from "@/lib/core/db"
import { getPlaidClient } from "@/lib/integrations/plaid"
import { decryptSecret } from "@/lib/integrations/crypto"
import { convertAmount } from "@/lib/services/fx"
import { mapPlaidCategory } from "@/lib/services/plaid-categories"
import type { Transaction as PlaidTxn, RemovedTransaction } from "plaid"

/**
 * Map Plaid account type + subtype to our BankAccount.accountType enum.
 * Plaid's `subtype` is the discriminator; `type` alone is too coarse.
 */
function mapAccountType(plaidType?: string | null, subtype?: string | null): string {
  if (plaidType === "credit") return "credit_card"
  if (plaidType === "depository") {
    if (subtype === "savings" || subtype === "money market" || subtype === "cd" || subtype === "hsa") {
      return "savings"
    }
    return "checking"
  }
  if (plaidType === "loan") return "credit_card" // close enough for UI bucketing
  return plaidType || "checking"
}

function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Plaid uses positive amount for outflows (expenses) and negative for inflows.
 * We normalize: type = "expense" | "income" | "transfer", total = positive cents.
 */
function mapTxnSign(amount: number, pfcPrimary?: string | null): { type: string; total: number } {
  if (pfcPrimary === "TRANSFER_IN" || pfcPrimary === "TRANSFER_OUT") {
    return { type: "transfer", total: toCents(Math.abs(amount)) }
  }
  if (amount >= 0) return { type: "expense", total: toCents(amount) }
  return { type: "income", total: toCents(Math.abs(amount)) }
}

/**
 * Pick a sensible default GL account for a freshly-linked Plaid bank account.
 * Depository → "1100 Bank Accounts" (asset). Credit → "2100 Credit Cards" (liability).
 * Falls back to "1000 Cash" or null if the org has customized codes.
 */
async function resolveDefaultChartAccount(
  orgId: string,
  accountType: string
): Promise<string | null> {
  const preferredCodes =
    accountType === "credit_card"
      ? ["2100", "2000"]
      : ["1100", "1000"]
  const found = await prisma.chartAccount.findFirst({
    where: { organizationId: orgId, code: { in: preferredCodes } },
    orderBy: { code: "asc" },
  })
  return found?.id ?? null
}

const LOCK_STALE_MS = 10 * 60 * 1000 // 10 min — reclaim locks orphaned by crashes

export async function syncPlaidItem(plaidItemId: string): Promise<{
  added: number
  modified: number
  removed: number
  skipped?: boolean
}> {
  // Atomic lock acquire: only sets syncingAt if it's NULL or stale.
  // Two concurrent callers race here; exactly one gets count === 1.
  const staleCutoff = new Date(Date.now() - LOCK_STALE_MS)
  const acquired = await prisma.plaidItem.updateMany({
    where: {
      id: plaidItemId,
      status: { not: "disconnected" },
      OR: [{ syncingAt: null }, { syncingAt: { lt: staleCutoff } }],
    },
    data: { syncingAt: new Date() },
  })
  if (acquired.count === 0) {
    // Either disconnected or another sync is already running. Not an error.
    return { added: 0, modified: 0, removed: 0, skipped: true }
  }

  try {
    return await runSyncWithLockHeld(plaidItemId)
  } finally {
    await prisma.plaidItem.update({
      where: { id: plaidItemId },
      data: { syncingAt: null },
    }).catch(() => {})
  }
}

async function runSyncWithLockHeld(plaidItemId: string): Promise<{
  added: number
  modified: number
  removed: number
}> {
  const item = await prisma.plaidItem.findUnique({
    where: { id: plaidItemId },
    include: {
      accounts: true,
      organization: { select: { id: true, baseCurrency: true } },
    },
  })
  if (!item) throw new Error("Plaid item not found")
  if (item.status === "disconnected") {
    return { added: 0, modified: 0, removed: 0 }
  }

  const client = getPlaidClient()
  const accessToken = decryptSecret(item.accessToken)
  const baseCurrency = item.organization.baseCurrency

  // plaid_account_id → { id, defaultChartAccountId }
  const accountMap = new Map<string, { id: string; defaultChartAccountId: string | null }>()
  for (const acc of item.accounts) {
    if (acc.plaidAccountId) {
      accountMap.set(acc.plaidAccountId, {
        id: acc.id,
        defaultChartAccountId: acc.defaultChartAccountId,
      })
    }
  }

  let cursor: string | undefined = item.cursor ?? undefined
  let added: PlaidTxn[] = []
  let modified: PlaidTxn[] = []
  let removed: RemovedTransaction[] = []
  let hasMore = true

  try {
    while (hasMore) {
      const res = await client.transactionsSync({
        access_token: accessToken,
        cursor,
        count: 500,
      })
      added = added.concat(res.data.added)
      modified = modified.concat(res.data.modified)
      removed = removed.concat(res.data.removed)
      hasMore = res.data.has_more
      cursor = res.data.next_cursor
    }
  } catch (err: any) {
    await prisma.plaidItem.update({
      where: { id: item.id },
      data: {
        status:
          err?.response?.data?.error_code === "ITEM_LOGIN_REQUIRED"
            ? "login_required"
            : "error",
        lastError: err?.response?.data?.error_message || err?.message || "sync failed",
      },
    })
    throw err
  }

  // Build an FX cache keyed by (from-currency|date) so we don't fetch the same
  // rate for every row of a 500-txn batch.
  const fxCache = new Map<string, { convertedCents: number; rate: number } | null>()
  async function convert(cents: number, from: string, date: Date) {
    if (!from || from === baseCurrency) return { convertedCents: cents, rate: 1 }
    const key = `${from}|${date.toISOString().slice(0, 10)}|${cents}`
    if (fxCache.has(key)) return fxCache.get(key)!
    const result = await convertAmount(cents, from, baseCurrency, date)
    fxCache.set(key, result)
    return result
  }

  for (const t of added) {
    const acc = accountMap.get(t.account_id)
    if (!acc) continue
    const pfcPrimary = t.personal_finance_category?.primary || null
    const { type, total } = mapTxnSign(t.amount, pfcPrimary)
    const currencyCode = t.iso_currency_code || t.unofficial_currency_code || baseCurrency
    const issuedAt = new Date(t.date)

    let convertedTotal: number | null = null
    let convertedCurrencyCode: string | null = null
    const conversion = await convert(total, currencyCode, issuedAt)
    if (conversion) {
      convertedTotal = conversion.convertedCents
      convertedCurrencyCode = baseCurrency
    }

    const categoryCode = mapPlaidCategory(pfcPrimary)

    await prisma.transaction.upsert({
      where: { plaidTransactionId: t.transaction_id },
      create: {
        organizationId: item.organizationId,
        userId: null, // system-created by Plaid sync
        name: t.name,
        merchant: t.merchant_name || t.name,
        description: t.original_description || null,
        total,
        currencyCode,
        convertedTotal,
        convertedCurrencyCode,
        type,
        bankAccountId: acc.id,
        chartAccountId: acc.defaultChartAccountId,
        categoryCode: categoryCode || null,
        paymentMethod: "bank_transfer",
        issuedAt,
        reference: t.payment_meta?.reference_number || null,
        source: "plaid",
        plaidTransactionId: t.transaction_id,
        pending: t.pending,
        extra: {
          plaidCategory: pfcPrimary,
          plaidCategoryDetailed: t.personal_finance_category?.detailed || null,
        },
      },
      update: {
        pending: t.pending,
        total,
        type,
        convertedTotal,
        convertedCurrencyCode,
      },
    })
  }

  for (const t of modified) {
    const pfcPrimary = t.personal_finance_category?.primary || null
    const { type, total } = mapTxnSign(t.amount, pfcPrimary)
    const currencyCode = t.iso_currency_code || t.unofficial_currency_code || baseCurrency
    const issuedAt = new Date(t.date)
    const conversion = await convert(total, currencyCode, issuedAt)

    await prisma.transaction.updateMany({
      where: { plaidTransactionId: t.transaction_id },
      data: {
        name: t.name,
        merchant: t.merchant_name || t.name,
        total,
        type,
        pending: t.pending,
        issuedAt,
        convertedTotal: conversion?.convertedCents ?? null,
        convertedCurrencyCode: conversion ? baseCurrency : null,
      },
    })
  }

  for (const r of removed) {
    if (!r.transaction_id) continue
    await prisma.transaction.deleteMany({
      where: { plaidTransactionId: r.transaction_id },
    })
  }

  // Refresh balances (best-effort)
  try {
    const balRes = await client.accountsBalanceGet({ access_token: accessToken })
    for (const acc of balRes.data.accounts) {
      const mapped = accountMap.get(acc.account_id)
      if (!mapped) continue
      const balance = acc.balances.current ?? acc.balances.available ?? 0
      await prisma.bankAccount.update({
        where: { id: mapped.id },
        data: { currentBalance: toCents(balance) },
      })
    }
  } catch {
    // ignore balance refresh errors
  }

  await prisma.plaidItem.update({
    where: { id: item.id },
    data: {
      cursor: cursor ?? null,
      lastSyncedAt: new Date(),
      status: "active",
      lastError: null,
    },
  })

  return { added: added.length, modified: modified.length, removed: removed.length }
}

export async function linkPlaidAccounts(
  orgId: string,
  params: {
    itemId: string
    accessToken: string // already encrypted
    institutionId?: string | null
    institutionName?: string | null
    accounts: Array<{
      plaidAccountId: string
      name: string
      officialName?: string | null
      mask?: string | null
      type?: string | null
      subtype?: string | null
      currency?: string | null
      currentBalance?: number | null
    }>
  }
) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { baseCurrency: true },
  })
  const fallbackCurrency = org?.baseCurrency || "USD"

  const plaidItem = await prisma.plaidItem.create({
    data: {
      organizationId: orgId,
      itemId: params.itemId,
      accessToken: params.accessToken,
      institutionId: params.institutionId || null,
      institutionName: params.institutionName || null,
    },
  })

  for (const a of params.accounts) {
    const accountType = mapAccountType(a.type, a.subtype)
    const defaultChartAccountId = await resolveDefaultChartAccount(orgId, accountType)
    await prisma.bankAccount.create({
      data: {
        organizationId: orgId,
        plaidItemId: plaidItem.id,
        plaidAccountId: a.plaidAccountId,
        name: a.name,
        officialName: a.officialName || null,
        bankName: params.institutionName || null,
        mask: a.mask || null,
        accountType,
        subtype: a.subtype || null,
        currency: a.currency || fallbackCurrency,
        currentBalance: a.currentBalance != null ? toCents(a.currentBalance) : 0,
        source: "plaid",
        defaultChartAccountId,
      },
    })
  }

  return plaidItem
}

export async function disconnectPlaidItem(plaidItemId: string, orgId: string) {
  const item = await prisma.plaidItem.findFirst({
    where: { id: plaidItemId, organizationId: orgId },
  })
  if (!item) throw new Error("Plaid item not found")

  try {
    const client = getPlaidClient()
    await client.itemRemove({ access_token: decryptSecret(item.accessToken) })
  } catch {
    // proceed with local cleanup even if remote remove fails
  }

  await prisma.plaidItem.update({
    where: { id: item.id },
    data: { status: "disconnected" },
  })
}

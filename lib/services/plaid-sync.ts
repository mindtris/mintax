import { prisma } from "@/lib/core/db"
import { getPlaidClient } from "@/lib/integrations/plaid"
import { decryptSecret } from "@/lib/integrations/crypto"
import type { Transaction as PlaidTxn, RemovedTransaction } from "plaid"

function mapAccountType(plaidType?: string | null): string {
  switch (plaidType) {
    case "credit":
      return "credit_card"
    case "depository":
      return "checking"
    default:
      return plaidType || "checking"
  }
}

function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Plaid uses positive amount for outflows (expenses) and negative for inflows.
 * We normalize: type = "expense" | "income", total always stored as positive cents.
 */
function mapTxnSign(amount: number): { type: string; total: number } {
  if (amount >= 0) return { type: "expense", total: toCents(amount) }
  return { type: "income", total: toCents(Math.abs(amount)) }
}

export async function syncPlaidItem(plaidItemId: string): Promise<{
  added: number
  modified: number
  removed: number
}> {
  const item = await prisma.plaidItem.findUnique({
    where: { id: plaidItemId },
    include: { accounts: true },
  })
  if (!item) throw new Error("Plaid item not found")
  if (item.status === "disconnected") {
    return { added: 0, modified: 0, removed: 0 }
  }

  const client = getPlaidClient()
  const accessToken = decryptSecret(item.accessToken)

  const accountIdToBankAccountId = new Map<string, string>()
  for (const acc of item.accounts) {
    if (acc.plaidAccountId) accountIdToBankAccountId.set(acc.plaidAccountId, acc.id)
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
        status: err?.response?.data?.error_code === "ITEM_LOGIN_REQUIRED" ? "login_required" : "error",
        lastError: err?.response?.data?.error_message || err?.message || "sync failed",
      },
    })
    throw err
  }

  const systemUser = await prisma.orgMember.findFirst({
    where: { organizationId: item.organizationId, role: { in: ["owner", "admin"] } },
    orderBy: { createdAt: "asc" },
  })
  const userId = systemUser?.userId
  if (!userId) throw new Error("No owner/admin found for org to attribute synced transactions")

  for (const t of added) {
    const bankAccountId = accountIdToBankAccountId.get(t.account_id)
    if (!bankAccountId) continue
    const { type, total } = mapTxnSign(t.amount)
    await prisma.transaction.upsert({
      where: { plaidTransactionId: t.transaction_id },
      create: {
        organizationId: item.organizationId,
        userId,
        name: t.name,
        merchant: t.merchant_name || t.name,
        description: t.original_description || null,
        total,
        currencyCode: t.iso_currency_code || undefined,
        type,
        bankAccountId,
        paymentMethod: "bank_transfer",
        issuedAt: new Date(t.date),
        reference: t.payment_meta?.reference_number || null,
        source: "plaid",
        plaidTransactionId: t.transaction_id,
        pending: t.pending,
      },
      update: {
        pending: t.pending,
        total,
        type,
      },
    })
  }

  for (const t of modified) {
    const { type, total } = mapTxnSign(t.amount)
    await prisma.transaction.updateMany({
      where: { plaidTransactionId: t.transaction_id },
      data: {
        name: t.name,
        merchant: t.merchant_name || t.name,
        total,
        type,
        pending: t.pending,
        issuedAt: new Date(t.date),
      },
    })
  }

  for (const r of removed) {
    if (!r.transaction_id) continue
    await prisma.transaction.deleteMany({
      where: { plaidTransactionId: r.transaction_id },
    })
  }

  // Refresh balances (cheap; best-effort)
  try {
    const balRes = await client.accountsBalanceGet({ access_token: accessToken })
    for (const acc of balRes.data.accounts) {
      const bankAccountId = accountIdToBankAccountId.get(acc.account_id)
      if (!bankAccountId) continue
      const balance = acc.balances.current ?? acc.balances.available ?? 0
      await prisma.bankAccount.update({
        where: { id: bankAccountId },
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
    await prisma.bankAccount.create({
      data: {
        organizationId: orgId,
        plaidItemId: plaidItem.id,
        plaidAccountId: a.plaidAccountId,
        name: a.name,
        officialName: a.officialName || null,
        bankName: params.institutionName || null,
        mask: a.mask || null,
        accountType: mapAccountType(a.type),
        subtype: a.subtype || null,
        currency: a.currency || "USD",
        currentBalance: a.currentBalance != null ? toCents(a.currentBalance) : 0,
        source: "plaid",
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

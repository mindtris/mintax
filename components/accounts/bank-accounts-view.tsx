import { AccountList } from "@/components/bank-accounts/account-list"
import { NewBankAccountSheet } from "@/components/bank-accounts/new-account-sheet"
import { PlaidItemsSection } from "@/components/bank-accounts/plaid-items-section"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { createBankAccount, getBankAccounts } from "@/lib/services/bank-accounts"
import { getCurrencies } from "@/lib/services/currencies"
import { prisma } from "@/lib/core/db"
import { revalidatePath } from "next/cache"

export async function BankAccountsView({ searchParams }: { searchParams: Promise<any> }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const params = await searchParams
  const accounts = await getBankAccounts(org.id, params)
  const orgCurrencies = await getCurrencies(org.id)

  const plaidItemsRaw = await prisma.plaidItem.findMany({
    where: { organizationId: org.id, status: { not: "disconnected" } },
    include: { _count: { select: { accounts: true } } },
    orderBy: { createdAt: "desc" },
  })
  const plaidItems = plaidItemsRaw.map((i) => ({
    id: i.id,
    institutionName: i.institutionName,
    status: i.status,
    lastSyncedAt: i.lastSyncedAt,
    accountsCount: i._count.accounts,
  }))

  async function addBankAccountAction(data: {
    name: string
    accountNumber?: string
    bankName?: string
    ifscCode?: string
    accountType?: string
    currency?: string
  }) {
    "use server"
    try {
      await createBankAccount(org.id, data)
      revalidatePath("/accounts")
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to create bank account" }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-display">Bank accounts</h1>
          <p className="text-sm text-muted-foreground">Manage your institution connections and track balances.</p>
        </div>
        <NewBankAccountSheet
          baseCurrency={org.baseCurrency}
          currencies={orgCurrencies.map((c) => ({ code: c.code, name: c.name }))}
          onAdd={addBankAccountAction}
        />
      </header>

      <PlaidItemsSection items={plaidItems} />

      <AccountList accounts={accounts} />
    </div>
  )
}

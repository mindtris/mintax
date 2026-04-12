import { AccountList } from "@/components/bank-accounts/account-list"
import { NewBankAccountSheet } from "@/components/bank-accounts/new-account-sheet"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { createBankAccount, getBankAccounts } from "@/lib/services/bank-accounts"
import { revalidatePath } from "next/cache"

export async function BankAccountsView({ searchParams }: { searchParams: Promise<any> }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const params = await searchParams
  const accounts = await getBankAccounts(org.id, params)

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
        <NewBankAccountSheet baseCurrency={org.baseCurrency} onAdd={addBankAccountAction} />
      </header>

      <AccountList accounts={accounts} />
    </div>
  )
}

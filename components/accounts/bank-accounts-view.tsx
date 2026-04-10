import { AccountList } from "@/components/bank-accounts/account-list"
import { Button } from "@/components/ui/button"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getBankAccounts } from "@/lib/services/bank-accounts"
import { Plus } from "lucide-react"
import Link from "next/link"

export async function BankAccountsView({ searchParams }: { searchParams: Promise<any> }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const params = await searchParams
  const accounts = await getBankAccounts(org.id, params)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-display">Bank accounts</h1>
          <p className="text-sm text-muted-foreground">Manage your institution connections and track balances.</p>
        </div>
        <div className="flex items-center gap-2">
            <Link href="/bank-accounts/new">
                <Button className="text-white">
                    <Plus className="h-4 w-4" />
                    <span>Add account</span>
                </Button>
            </Link>
        </div>
      </header>

      <AccountList accounts={accounts} />
    </div>
  )
}

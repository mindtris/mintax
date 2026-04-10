import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getBankAccounts } from "@/lib/services/bank-accounts"
import { ReconciliationList } from "@/components/accounts/reconciliation-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Landmark } from "lucide-react"

export async function ReconciliationView() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const bankAccounts = await getBankAccounts(org.id)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Reconciliation</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/bank-accounts/new">
            <Button>
              <Landmark className="h-4 w-4" />
              <span className="hidden md:block">Add account</span>
            </Button>
          </Link>
        </div>
      </header>

      <ReconciliationList accounts={bankAccounts} />
    </div>
  )
}

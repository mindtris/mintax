import { Metadata } from "next"
import { TransactionsView } from "@/components/accounts/transactions-view"
import { BillsView } from "@/components/accounts/bills-view"
import { BankAccountsView } from "@/components/accounts/bank-accounts-view"
import { ReconciliationView } from "@/components/accounts/reconciliation-view"
import { ReportsView } from "@/components/accounts/reports-view"
import { UnsortedView } from "@/components/accounts/unsorted-view"
import { TransactionFilters } from "@/lib/services/transactions"

export const metadata: Metadata = {
  title: "Accounts",
  description: "Manage your financial accounts, transactions, and bills.",
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionFilters & { tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "transactions"

  const renderView = () => {
    switch (activeTab) {
      case "transactions":
        return <TransactionsView searchParams={params} />
      case "bills":
        return <BillsView searchParams={params as any} />
      case "bank-accounts":
        return <BankAccountsView searchParams={searchParams} />
      case "reconciliation":
        return <ReconciliationView />
      case "reports":
        return <ReportsView searchParams={searchParams} />
      case "unsorted":
        return <UnsortedView searchParams={searchParams} />
      default:
        return <TransactionsView searchParams={params} />
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {renderView()}
    </div>
  )
}

import { ExportTransactionsDialog } from "@/components/export/transactions"
import { TransactionSearchAndFilters } from "@/components/transactions/filters"
import { TransactionList } from "@/components/transactions/list"
import { NewTransactionDialog } from "@/components/transactions/new"
import { Pagination } from "@/components/transactions/pagination"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCategories } from "@/lib/services/categories"
import { getFields } from "@/lib/services/fields"
import { getProjects } from "@/lib/services/projects"
import { getTransactions, TransactionFilters } from "@/lib/services/transactions"
import { Download } from "lucide-react"
import { redirect } from "next/navigation"

const TRANSACTIONS_PER_PAGE = 500

export async function TransactionsView({ searchParams }: { searchParams: TransactionFilters }) {
  const { page, ...filters } = searchParams
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { transactions, total } = await getTransactions(org.id, filters, {
    limit: TRANSACTIONS_PER_PAGE,
    offset: ((page ?? 1) - 1) * TRANSACTIONS_PER_PAGE,
  })
  const categories = await getCategories(org.id)
  const projects = await getProjects(org.id)
  const fields = await getFields(org.id)

  // Reset page if user clicks a filter and no transactions are found
  if (page && page > 1 && transactions.length === 0) {
    const params = new URLSearchParams(filters as Record<string, string>)
    params.set("tab", "transactions")
    redirect(`/accounts?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Transactions</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {total}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportTransactionsDialog fields={fields} categories={categories} projects={projects} total={total}>
            <Download /> <span className="hidden md:block">Export</span>
          </ExportTransactionsDialog>
          <NewTransactionDialog />
        </div>
      </header>

      <TransactionSearchAndFilters categories={categories} projects={projects} fields={fields} />

      <main>
        <TransactionList
          transactions={transactions}
          fields={fields}
        />

        {total > TRANSACTIONS_PER_PAGE && <Pagination totalItems={total} itemsPerPage={TRANSACTIONS_PER_PAGE} />}
      </main>
    </div>
  )
}

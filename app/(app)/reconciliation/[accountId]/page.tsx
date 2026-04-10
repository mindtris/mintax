import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getBankAccountById } from "@/lib/services/bank-accounts"
import {
  getAutoMatchSuggestions,
  getReconciliationStats,
  getUnmatchedEntries,
  getUnreconciledTransactions,
} from "@/lib/services/reconciliation"
import { notFound } from "next/navigation"
import { ReconciliationWorkspace } from "./reconciliation-workspace"

export default async function ReconciliationDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const account = await getBankAccountById(accountId, org.id)

  if (!account) notFound()

  const [entries, transactions, suggestions, stats] = await Promise.all([
    getUnmatchedEntries(accountId),
    getUnreconciledTransactions(org.id, accountId),
    getAutoMatchSuggestions(org.id, accountId),
    getReconciliationStats(accountId),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reconcile: {account.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Match bank entries to transactions. {stats.unmatched} unmatched of {stats.total} entries.
        </p>
      </header>

      <ReconciliationWorkspace
        accountId={accountId}
        entries={entries}
        transactions={transactions}
        suggestions={suggestions}
        stats={stats}
      />
    </div>
  )
}

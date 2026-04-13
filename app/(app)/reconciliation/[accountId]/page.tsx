import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getBankAccountById } from "@/lib/services/bank-accounts"
import {
  getAutoMatchSuggestions,
  getDiscrepancyReport,
  getReconciliationStats,
  getUnmatchedEntries,
  getUnreconciledTransactions,
} from "@/lib/services/reconciliation"
import { formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"
import { ReconciliationWorkspace } from "./reconciliation-workspace"

export default async function ReconciliationDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const account = await getBankAccountById(accountId, org.id)

  if (!account) notFound()

  const [entries, transactions, suggestions, stats, discrepancy] = await Promise.all([
    getUnmatchedEntries(accountId),
    getUnreconciledTransactions(org.id, accountId),
    getAutoMatchSuggestions(org.id, accountId),
    getReconciliationStats(accountId),
    getDiscrepancyReport(org.id, accountId),
  ])

  const isBalanced = discrepancy.discrepancy === 0
  const currency = account.currency || "INR"

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reconcile: {account.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Match bank entries to transactions. {stats.unmatched} unmatched of {stats.total} entries.
        </p>
      </header>

      {/* Discrepancy summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#f5f4ef] text-[#141413] shadow-sm rounded-lg border border-black/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            Bank only (unmatched)
          </p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(discrepancy.bankOnlyTotal, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {discrepancy.bankOnly.length} entries on statement, not in books
          </p>
        </div>

        <div className="bg-[#f5f4ef] text-[#141413] shadow-sm rounded-lg border border-black/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            Books only (unreconciled)
          </p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(discrepancy.booksOnlyTotal, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {discrepancy.booksOnly.length} transactions in books, not on statement
          </p>
        </div>

        <div
          className={`shadow-sm rounded-lg border p-4 ${
            isBalanced
              ? "bg-green-500/10 text-green-800 border-green-500/20"
              : "bg-amber-500/10 text-amber-800 border-amber-500/20"
          }`}
        >
          <p className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">
            {isBalanced ? "Balanced ✓" : "Discrepancy"}
          </p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(Math.abs(discrepancy.discrepancy), currency)}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            {isBalanced
              ? "Books and bank statement agree"
              : "Resolve unmatched items to balance"}
          </p>
        </div>
      </div>

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

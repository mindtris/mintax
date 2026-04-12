"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type Props = {
  accountId: string
  entries: any[]
  transactions: any[]
  suggestions: any[]
  stats: { unmatched: number; matched: number; reconciled: number; excluded: number; total: number }
}

function formatAmount(amount: number) {
  return (Math.abs(amount) / 100).toFixed(2)
}

export function ReconciliationWorkspace({ accountId, entries, transactions, suggestions, stats }: Props) {
  const router = useRouter()
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const suggestionMap = new Map(suggestions.map((s) => [s.entryId, s]))

  async function handleMatch(entryId: string, transactionId: string) {
    setLoading(entryId)
    try {
      const { matchEntry } = await import("@/lib/services/reconciliation")
      await matchEntry(entryId, transactionId)
      toast.success("Entry matched successfully")
      router.refresh()
    } catch (error) {
      console.error("Match failed:", error)
      toast.error("Failed to match entry")
    } finally {
      setLoading(null)
      setSelectedEntry(null)
    }
  }

  async function handleExclude(entryId: string) {
    setLoading(entryId)
    try {
      const { excludeEntry } = await import("@/lib/services/reconciliation")
      await excludeEntry(entryId)
      toast.success("Entry excluded")
      router.refresh()
    } catch (error) {
      console.error("Exclude failed:", error)
      toast.error("Failed to exclude entry")
    } finally {
      setLoading(null)
    }
  }

  async function handleAutoMatchAll() {
    setLoading("auto")
    try {
      const { matchEntry } = await import("@/lib/services/reconciliation")
      const matched = suggestions.filter((s) => s.confidence >= 80)
      for (const suggestion of matched) {
        await matchEntry(suggestion.entryId, suggestion.transactionId)
      }
      toast.success(`Auto-matched ${matched.length} entries`)
      router.refresh()
    } catch (error) {
      console.error("Auto-match failed:", error)
      toast.error("Auto-match failed")
    } finally {
      setLoading(null)
    }
  }

  const highConfidenceSuggestions = suggestions.filter((s) => s.confidence >= 80)

  return (
    <div className="flex flex-col gap-6">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/reconciliation">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
        <Badge variant="outline">{stats.unmatched} unmatched</Badge>
        <Badge variant="secondary">{stats.matched} matched</Badge>
        <Badge className="bg-green-100 text-green-700">{stats.reconciled} reconciled</Badge>
        {stats.excluded > 0 && <Badge variant="outline">{stats.excluded} excluded</Badge>}

        {highConfidenceSuggestions.length > 0 && (
          <Button
            variant="default"
            size="sm"
            className="ml-auto"
            onClick={handleAutoMatchAll}
            disabled={loading === "auto"}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {loading === "auto" ? "Matching..." : `Auto-match ${highConfidenceSuggestions.length} entries`}
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">All entries matched</h3>
            <p className="text-sm text-muted-foreground mt-1">No unmatched bank entries remaining.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Bank entries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bank entries ({entries.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 max-h-[600px] overflow-y-auto">
              {entries.map((entry) => {
                const suggestion = suggestionMap.get(entry.id)
                const isSelected = selectedEntry === entry.id
                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(isSelected ? null : entry.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{entry.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), "MMM d, yyyy")}
                        {entry.reference && ` \u00B7 ${entry.reference}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={cn("text-sm font-semibold", entry.amount > 0 ? "text-green-600" : "")}>
                        {entry.amount > 0 ? "+" : "-"}{formatAmount(entry.amount)}
                      </span>
                      {suggestion && (
                        <Badge variant="secondary" className="text-[10px]">
                          {suggestion.confidence}%
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExclude(entry.id)
                        }}
                        disabled={loading === entry.id}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Right: Transactions to match */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedEntry ? "Select a transaction to match" : "Unreconciled transactions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 max-h-[600px] overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No unreconciled transactions found for this account.
                </p>
              ) : (
                transactions.map((txn) => {
                  const suggestion = selectedEntry ? suggestionMap.get(selectedEntry) : null
                  const isSuggested = suggestion?.transactionId === txn.id

                  return (
                    <div
                      key={txn.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        isSuggested ? "bg-green-50 ring-1 ring-green-200" : "hover:bg-muted/30",
                        selectedEntry ? "cursor-pointer" : ""
                      )}
                      onClick={() => {
                        if (selectedEntry) handleMatch(selectedEntry, txn.id)
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{txn.name || txn.merchant || "Unnamed"}</span>
                          {isSuggested && (
                            <Badge className="bg-green-100 text-green-700 text-[10px]">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Suggested
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {txn.issuedAt ? format(new Date(txn.issuedAt), "MMM d, yyyy") : "No date"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className={cn("text-sm font-semibold", txn.type === "income" ? "text-green-600" : "")}>
                          {txn.type === "income" ? "+" : "-"}{formatAmount(txn.total || 0)}
                        </span>
                        {selectedEntry && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

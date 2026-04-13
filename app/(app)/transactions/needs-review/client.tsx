"use client"

import { useState, useTransition } from "react"
import { approveTransactionsAction } from "../actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

export function NeedsReviewClient({ transactions }: { transactions: any[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isApproving, startApproving] = useTransition()

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selected.size === transactions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(transactions.map((t) => t.id)))
    }
  }

  function approveSelected() {
    if (selected.size === 0) {
      toast.error("Select at least one transaction")
      return
    }
    startApproving(async () => {
      const result = await approveTransactionsAction(Array.from(selected))
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Approved ${result.data?.count} transactions`)
        setSelected(new Set())
        router.refresh()
      }
    })
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-semibold">All caught up</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No transactions are awaiting review.
        </p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bulk action bar */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected.size === transactions.length && transactions.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} of ${transactions.length} selected`
              : `${transactions.length} transactions awaiting review`}
          </span>
        </div>
        <Button onClick={approveSelected} disabled={isApproving || selected.size === 0} size="sm">
          {isApproving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Approving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve {selected.size > 0 ? `(${selected.size})` : "selected"}
            </>
          )}
        </Button>
      </div>

      {/* Transaction list */}
      <div className="flex flex-col gap-2">
        {transactions.map((tx) => {
          const isSelected = selected.has(tx.id)
          const hasLowConfidence = tx.aiConfidence
            ? Object.values(tx.aiConfidence as Record<string, number>).some((c) => c < 0.8)
            : false
          return (
            <Card
              key={tx.id}
              className={`p-4 transition-colors ${isSelected ? "bg-muted/40 border-primary/30" : ""}`}
            >
              <div className="flex items-center gap-4">
                <Checkbox checked={isSelected} onCheckedChange={() => toggle(tx.id)} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/transactions/${tx.id}`}
                      className="font-semibold text-sm hover:underline truncate"
                    >
                      {tx.name || tx.merchant || "(untitled)"}
                    </Link>
                    {tx.source === "ai" && (
                      <Badge variant="outline" className="text-[9px] uppercase">
                        AI
                      </Badge>
                    )}
                    {hasLowConfidence && (
                      <Badge variant="outline" className="text-[9px] uppercase border-amber-500/40 text-amber-600">
                        <AlertCircle className="h-3 w-3 mr-0.5" />
                        Low confidence
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {tx.merchant && <span>{tx.merchant}</span>}
                    {tx.category?.name && (
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tx.category.color }} />
                        {tx.category.name}
                      </span>
                    )}
                    {tx.issuedAt && <span>{format(new Date(tx.issuedAt), "MMM d, yyyy")}</span>}
                    {tx.number && <span className="font-mono">{tx.number}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatCurrency(tx.total || 0, tx.currencyCode || "INR")}
                  </div>
                  {tx.type && (
                    <div className="text-[10px] uppercase text-muted-foreground mt-0.5">{tx.type}</div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

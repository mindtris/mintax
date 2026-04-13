"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Landmark, RefreshCcw, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type PlaidItemRow = {
  id: string
  institutionName: string | null
  status: string
  lastSyncedAt: Date | null
  accountsCount: number
}

interface Props {
  items: PlaidItemRow[]
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "border-green-500/30 bg-green-500/5 text-green-700" },
  login_required: { label: "Re-link needed", className: "border-amber-500/30 bg-amber-500/5 text-amber-700" },
  error: { label: "Error", className: "border-red-500/30 bg-red-500/5 text-red-700" },
  disconnected: { label: "Disconnected", className: "border-muted-foreground/30 bg-muted text-muted-foreground" },
}

export function PlaidItemsSection({ items }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (items.length === 0) return null

  const sync = async (id: string) => {
    setBusy(id)
    try {
      const res = await fetch(`/api/plaid/items/${id}/sync`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Sync failed")
      toast.success(`Synced: +${data.added} added, ${data.modified} modified`)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Sync failed")
    } finally {
      setBusy(null)
    }
  }

  const disconnect = async (id: string) => {
    if (!confirm("Disconnect this bank? Synced transactions will be kept but no new ones will be pulled.")) return
    setBusy(id)
    try {
      const res = await fetch(`/api/plaid/items/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Disconnect failed")
      toast.success("Bank disconnected")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Disconnect failed")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Plaid connections</h2>
      <div className="grid gap-2">
        {items.map((item) => {
          const status = STATUS_LABELS[item.status] || STATUS_LABELS.active
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-[#f5f4ef] text-[#141413] shadow-sm px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center border border-primary/10">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">{item.institutionName || "Connected bank"}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.accountsCount} account{item.accountsCount === 1 ? "" : "s"}
                    {item.lastSyncedAt ? ` • Last synced ${new Date(item.lastSyncedAt).toLocaleString()}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${status.className}`}>{status.label}</Badge>
                <Button size="sm" onClick={() => sync(item.id)} disabled={busy === item.id || item.status === "disconnected"}>
                  <RefreshCcw className="h-3.5 w-3.5" />
                  <span>Sync</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => disconnect(item.id)}
                  disabled={busy === item.id || item.status === "disconnected"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { MoreVertical, Pencil, Trash2, UserCheck, Target } from "lucide-react"
import { STAGE_LABELS, SOURCE_LABELS } from "@/lib/services/leads"
import { deleteLeadAction, convertLeadAction } from "@/app/(app)/sales/actions"
import { NewLeadSheet } from "./new-lead-sheet"
import Image from "next/image"

export type LeadRow = {
  id: string
  title: string
  contactName: string
  email: string | null
  phone: string | null
  company: string | null
  stage: string
  source: string | null
  value: number
  currency: string
  probability: number
  createdAt: string | Date
  expectedCloseAt: string | Date | null
}

const stageStyles: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  qualified: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  proposal: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  negotiation: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  won: "bg-green-500/10 text-green-600 border-green-500/20",
  lost: "bg-red-500/10 text-red-600 border-red-500/20",
}

export function LeadsTable({ leads, visibleColumns, currency }: { leads: LeadRow[]; visibleColumns?: string[]; currency?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingLead, setEditingLead] = useState<any>(null)

  const [sorting, setSorting] = useState<SortState>(() => {
    const ordering = searchParams.get("ordering")
    if (!ordering) return { field: null, direction: null }
    const isDesc = ordering.startsWith("-")
    return { field: isDesc ? ordering.slice(1) : ordering, direction: isDesc ? "desc" : "asc" }
  })

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (sorting.field && sorting.direction) {
      params.set("ordering", sorting.direction === "desc" ? `-${sorting.field}` : sorting.field)
    } else {
      params.delete("ordering")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [sorting])

  const columns: DataGridColumn<LeadRow>[] = useMemo(() => [
    {
      key: "title",
      label: "Lead",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground truncate">{row.title}</span>
            <span className="text-[11px] text-muted-foreground truncate">
              {row.contactName}{row.company ? ` · ${row.company}` : ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className={cn("text-[10px] font-medium capitalize", stageStyles[row.stage])}>
          {STAGE_LABELS[row.stage] || row.stage}
        </Badge>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (row) => (
        <span className="text-sm text-muted-foreground capitalize">
          {row.source ? (SOURCE_LABELS[row.source] || row.source) : "—"}
        </span>
      ),
    },
    {
      key: "value",
      label: "Value",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-sm">
          {row.value > 0
            ? (row.value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, style: "currency", currency: row.currency || "INR" })
            : "—"
          }
        </span>
      ),
    },
    {
      key: "probability",
      label: "Prob.",
      align: "center",
      render: (row) => (
        <span className="text-sm tabular-nums">{row.probability}%</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => (
        <span className="text-sm tabular-nums">
          {format(new Date(row.createdAt), "MMM dd, yyyy")}
        </span>
      ),
    },
  ], [])

  const filteredColumns = visibleColumns
    ? columns.filter((col) => visibleColumns.includes(col.key))
    : columns

  return (
    <>
      <DataGrid
        data={leads}
        columns={filteredColumns}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sort={sorting}
        onSortChange={setSorting}
        renderDetailSheet={(row, onClose) => (
          <div className="flex flex-col gap-4 p-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{row.title}</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditingLead(row); onClose() }}>
                    <Pencil className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  {row.stage !== "won" && (
                    <DropdownMenuItem onClick={async () => { await convertLeadAction(row.id); router.refresh(); onClose() }}>
                      <UserCheck className="h-4 w-4" /> Convert to contact
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive" onClick={async () => { if (confirm("Delete this lead?")) { await deleteLeadAction(row.id); router.refresh(); onClose() } }}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Contact:</span> {row.contactName}</div>
              <div><span className="text-muted-foreground">Company:</span> {row.company || "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {row.email || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {row.phone || "—"}</div>
              <div><span className="text-muted-foreground">Stage:</span> {STAGE_LABELS[row.stage]}</div>
              <div><span className="text-muted-foreground">Source:</span> {row.source ? SOURCE_LABELS[row.source] : "—"}</div>
              <div><span className="text-muted-foreground">Value:</span> {row.value > 0 ? (row.value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, style: "currency", currency: row.currency }) : "—"}</div>
              <div><span className="text-muted-foreground">Probability:</span> {row.probability}%</div>
              {row.expectedCloseAt && (
                <div><span className="text-muted-foreground">Expected close:</span> {format(new Date(row.expectedCloseAt), "MMM dd, yyyy")}</div>
              )}
            </div>
          </div>
        )}
        emptyIcon={<Image src="/empty-state.svg" alt="No leads" width={120} height={120} priority />}
        emptyTitle="Leads"
        emptyDescription="No leads yet. Create your first one to start tracking your sales pipeline."
      />

      <NewLeadSheet lead={editingLead} currency={currency} open={!!editingLead} onOpenChange={(open) => { if (!open) setEditingLead(null) }} />
    </>
  )
}

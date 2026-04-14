"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { MoreVertical, Pencil, Trash2, UserCheck, Target } from "lucide-react"
import { SOURCE_LABELS } from "@/lib/services/leads"
import { NewLeadSheet } from "./new-lead-sheet"
import { convertLeadAction, deleteLeadAction } from "@/app/(app)/sales/actions"
import Image from "next/image"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

const STAGE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "outline",
  contacted: "secondary",
  qualified: "secondary",
  proposal: "secondary",
  negotiation: "secondary",
  won: "default",
  lost: "destructive",
}

export function LeadsTable({ leads, visibleColumns, currency, categories }: { leads: LeadRow[]; visibleColumns?: string[]; currency?: string; categories?: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingLead, setEditingLead] = useState<any>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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
        <Badge variant={STAGE_VARIANTS[row.stage] || "outline"} className="text-[10px] capitalize">
          {categories?.find(c => c.code === row.stage)?.name || row.stage}
        </Badge>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (row) => (
        <span className={cn("text-sm text-muted-foreground capitalize", !row.source && "text-muted-foreground/50 italic text-[11px]")}>
          {row.source ? (SOURCE_LABELS[row.source] || row.source) : "Not available"}
        </span>
      ),
    },
    {
      key: "value",
      label: "Value",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className={cn("font-mono font-bold text-sm", row.value <= 0 && "text-muted-foreground/50 font-normal italic text-[11px]")}>
          {row.value > 0
            ? (row.value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, style: "currency", currency: row.currency || "INR" })
            : "Not available"
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
          <div className="flex flex-col h-full gap-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-semibold leading-none">{row.title}</SheetTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingLead(row); onClose() }}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    {row.stage !== "won" && (
                      <DropdownMenuItem
                        onClick={async () => {
                          const res = await convertLeadAction(row.id)
                          if (res.success) {
                            toast.success("Lead converted to contact")
                            router.refresh()
                            onClose()
                          } else {
                            toast.error(res.error || "Failed to convert lead")
                          }
                        }}
                      >
                        <UserCheck className="h-4 w-4" /> Convert to contact
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteConfirmId(row.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Contact:</span> {row.contactName}</div>
                <div><span className="text-muted-foreground">Company:</span> {row.company || <span className="text-muted-foreground/50 italic text-[11px]">Not available</span>}</div>
                <div><span className="text-muted-foreground">Email:</span> {row.email || <span className="text-muted-foreground/50 italic text-[11px]">Not available</span>}</div>
                <div><span className="text-muted-foreground">Phone:</span> {row.phone || <span className="text-muted-foreground/50 italic text-[11px]">Not available</span>}</div>
                <div><span className="text-muted-foreground">Stage:</span> {categories?.find(c => c.code === row.stage)?.name || row.stage}</div>
                <div><span className="text-muted-foreground">Source:</span> {row.source ? (SOURCE_LABELS[row.source] || row.source) : <span className="text-muted-foreground/50 italic text-[11px]">Not available</span>}</div>
                <div><span className="text-muted-foreground">Value:</span> {row.value > 0 ? (row.value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, style: "currency", currency: row.currency || "INR" }) : <span className="text-muted-foreground/50 italic text-[11px]">Not available</span>}</div>
                <div><span className="text-muted-foreground">Probability:</span> {row.probability}%</div>
                {row.expectedCloseAt && (
                  <div><span className="text-muted-foreground">Expected close:</span> {format(new Date(row.expectedCloseAt), "MMM dd, yyyy")}</div>
                )}
              </div>
            </div>
          </div>
        )}
        emptyIcon={<Image src="/empty-state.svg" alt="No leads" width={120} height={120} priority />}
        emptyTitle="Leads"
        emptyDescription="No leads yet. Create your first one to start tracking your sales pipeline."
      />

      <NewLeadSheet lead={editingLead} currency={currency} categories={categories} open={!!editingLead} onOpenChange={(open) => { if (!open) setEditingLead(null) }} />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteConfirmId) {
                  const res = await deleteLeadAction(deleteConfirmId)
                  if (res.success) {
                    toast.success("Lead deleted successfully")
                    router.refresh()
                  } else {
                    toast.error(res.error || "Failed to delete lead")
                  }
                  setDeleteConfirmId(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

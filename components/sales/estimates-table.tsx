"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { FileText, EllipsisVertical, Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteInvoiceAction } from "@/app/(app)/invoices/actions"
import { toast } from "sonner"
import { EditInvoiceSheet } from "@/components/invoices/edit-invoice-sheet"

export type EstimateRow = {
  id: string
  invoiceNumber: string
  clientName: string
  total: number
  currency: string
  status: string
  issuedAt: string | Date
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  accepted: "default",
  sent: "secondary",
  draft: "outline",
  declined: "destructive",
}

export function EstimatesTable({ estimates, visibleColumns }: { estimates: EstimateRow[]; visibleColumns?: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null)

  const [sorting, setSorting] = useState<SortState>(() => {
    const ordering = searchParams.get("ordering")
    if (!ordering) return { field: null, direction: null }
    const isDesc = ordering.startsWith("-")
    return {
      field: isDesc ? ordering.slice(1) : ordering,
      direction: isDesc ? "desc" : "asc",
    }
  })

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (sorting.field && sorting.direction) {
      const ordering = sorting.direction === "desc" ? `-${sorting.field}` : sorting.field
      params.set("ordering", ordering)
    } else {
      params.delete("ordering")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [sorting])

  const columns: DataGridColumn<EstimateRow>[] = useMemo(() => [
    {
      key: "invoiceNumber",
      label: "Estimate",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.invoiceNumber}</span>
            <span className="text-[11px] text-muted-foreground">{row.clientName}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] || "outline"} className="text-[10px] font-medium capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      key: "issuedAt",
      label: "Issued",
      sortable: true,
      render: (row) => (
        <span className="text-sm tabular-nums">
          {format(new Date(row.issuedAt), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: "total",
      label: "Amount",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-sm">
          {(row.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2, style: "currency", currency: row.currency || "USD" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRowClick(row)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this estimate?")) {
                    const res = await deleteInvoiceAction(row.id)
                    if (res?.error) toast.error(res.error)
                    else toast.success("Estimate deleted")
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [router, searchParams])

  const filteredColumns = visibleColumns
    ? columns.filter((col) => visibleColumns.includes(col.key))
    : columns

  const handleRowClick = (row: EstimateRow) => {
    setSelectedEstimateId(row.id)
    setIsSheetOpen(true)
  }

  return (
    <>
      <DataGrid
        data={estimates}
        columns={filteredColumns}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sort={sorting}
        onSortChange={setSorting}
        onRowClick={handleRowClick}
        emptyIcon={
          <Image src="/empty-state.svg" alt="No estimates" width={120} height={120} priority />
        }
        emptyTitle="Estimates"
        emptyDescription="No estimates yet. Create your first one to get started."
      />

      <EditInvoiceSheet 
        invoiceId={selectedEstimateId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  )
}

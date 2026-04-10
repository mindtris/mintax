"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export type InvoiceRow = {
  id: string
  invoiceNumber: string
  clientName: string
  total: number
  currency: string
  status: string
  issuedAt: string | Date
  dueAt: string | Date | null
}

const statusStyles: Record<string, string> = {
  paid: "bg-green-500/10 text-green-600 border-green-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  draft: "bg-muted text-muted-foreground border-border",
}

export function InvoicesTable({ invoices, visibleColumns }: { invoices: InvoiceRow[]; visibleColumns?: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  const columns: DataGridColumn<InvoiceRow>[] = useMemo(() => [
    {
      key: "invoiceNumber",
      label: "Invoice",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <Receipt className="h-4 w-4 text-primary" />
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
        <Badge variant="outline" className={cn("text-[10px] font-medium capitalize", statusStyles[row.status] || statusStyles.draft)}>
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
  ], [])

  const filteredColumns = visibleColumns
    ? columns.filter((col) => visibleColumns.includes(col.key))
    : columns

  return (
    <DataGrid
      data={invoices}
      columns={filteredColumns}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      sort={sorting}
      onSortChange={setSorting}
      onRowClick={(row) => router.push(`/invoices/${row.id}`)}
      emptyIcon={
        <Image src="/empty-state.svg" alt="No invoices" width={120} height={120} priority />
      }
      emptyTitle="Invoices"
      emptyDescription="No invoices yet. Create your first one to get started."
    />
  )
}

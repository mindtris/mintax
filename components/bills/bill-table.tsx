"use client"

import { deleteBillAction, markBillPaidAction } from "@/app/(app)/bills/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid, DataGridColumn } from "@/components/ui/data-grid"
import { NewBillSheet } from "@/components/bills/new-bill-sheet"
import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { formatDate } from "date-fns"
import { CheckCircle, ExternalLink, Plus, ReceiptText, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import Image from "next/image"

import { BillColumnKey, useBillVisibility } from "@/lib/hooks/use-bill-visibility"
import { BillSearchAndFilters } from "@/components/bills/filters"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending: "secondary",
  paid: "default",
  overdue: "destructive",
  cancelled: "outline",
}

function formatAmount(amount: number, currency: string) {
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
}

interface Bill {
  id: string
  billNumber: string
  vendorName: string
  vendorEmail?: string | null
  vendorAddress?: string | null
  vendorTaxId?: string | null
  status: string
  issuedAt: string | Date | null
  dueAt: string | Date | null
  paidAt?: string | Date | null
  subtotal?: number
  taxTotal?: number
  total: number
  currency: string
  notes?: string | null
}

const allColumns: DataGridColumn<Bill>[] = [
  {
    key: "billNumber",
    label: "Bill",
    className: "font-medium",
    sortable: true,
  },
  {
    key: "vendorName",
    label: "Vendor",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (bill) => (
      <Badge variant={statusVariant[bill.status] || "outline"} className="capitalize">
        {bill.status}
      </Badge>
    ),
  },
  {
    key: "issuedAt",
    label: "Issued",
    sortable: true,
    render: (bill) =>
      bill.issuedAt ? formatDate(new Date(bill.issuedAt), "MMM dd, yyyy") : "-",
  },
  {
    key: "dueAt",
    label: "Due",
    sortable: true,
    render: (bill) =>
      bill.dueAt ? formatDate(new Date(bill.dueAt), "MMM dd, yyyy") : "-",
  },
  {
    key: "paidAt",
    label: "Paid Date",
    sortable: true,
    render: (bill) =>
      bill.paidAt ? formatDate(new Date(bill.paidAt), "MMM dd, yyyy") : "-",
  },
  {
    key: "total",
    label: "Total",
    align: "right",
    className: "font-medium",
    sortable: true,
    render: (bill) => formatAmount(bill.total, bill.currency),
  },
]

function BillDetailSheet({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkPaid = async () => {
    setIsLoading(true)
    try {
      await markBillPaidAction(bill.id)
      router.refresh()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this bill?")) return
    setIsLoading(true)
    try {
      await deleteBillAction(bill.id)
      router.refresh()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
        <SheetTitle className="flex items-center gap-2">
          {bill.billNumber}
          <Badge variant={statusVariant[bill.status] || "outline"} className="capitalize font-medium">
            {bill.status}
          </Badge>
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Vendor info */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-display">Vendor details</h4>
          <div className="bg-muted/10 p-4 rounded-md border border-border">
            <p className="font-semibold text-foreground">{bill.vendorName}</p>
            {bill.vendorEmail && <p className="text-sm text-muted-foreground mt-1">{bill.vendorEmail}</p>}
            {bill.vendorAddress && (
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">{bill.vendorAddress}</p>
            )}
            {bill.vendorTaxId && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Tax ID</p>
                <p className="text-sm font-medium">{bill.vendorTaxId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Timeline */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-display">Timeline</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/10 p-4 rounded-md border border-border">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase font-display">Issued</p>
              <p className="font-medium mt-1">
                {bill.issuedAt ? formatDate(new Date(bill.issuedAt), "MMM dd, yyyy") : "-"}
              </p>
            </div>
            <div className="bg-muted/10 p-4 rounded-md border border-border">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase font-display">Due date</p>
              <p className={`font-medium mt-1 ${bill.status === 'overdue' ? 'text-destructive' : ''}`}>
                {bill.dueAt ? formatDate(new Date(bill.dueAt), "MMM dd, yyyy") : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Settlement Summary */}
        <div className="space-y-4 pb-4">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-display">Settlement</h4>
          <div className="space-y-2 px-1">
            {bill.subtotal !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatAmount(bill.subtotal, bill.currency)}</span>
              </div>
            )}
            {bill.taxTotal !== undefined && bill.taxTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatAmount(bill.taxTotal, bill.currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 mt-2 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Amount owed</span>
              <span className="text-2xl font-bold tracking-tight text-foreground">{formatAmount(bill.total, bill.currency)}</span>
            </div>
          </div>
        </div>

        {/* Internal Notes */}
        {bill.notes && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-display">Audit notes</h4>
            <div className="bg-muted/10 p-4 rounded-lg italic text-sm text-foreground/80 border-l-2 border-primary/20 leading-relaxed">
              {bill.notes}
            </div>
          </div>
        )}
      </div>

      <SheetFooter className="shrink-0 px-6 py-4 border-t">
        <div className="flex flex-col gap-3 w-full">
          {bill.status !== "paid" && (
            <Button onClick={handleMarkPaid} disabled={isLoading} className="w-full h-12 text-md font-semibold text-white">
              <CheckCircle className="h-5 w-5 mr-2" />
              Mark as settled
            </Button>
          )}
          <div className="flex gap-3">
            <Button
                variant="outline"
                className="flex-1 h-11 font-medium"
                onClick={() => { onClose(); window.location.href = `/bills/${bill.id}` }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Full view
            </Button>
            <Button variant="destructive" size="icon" className="h-11 w-11" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetFooter>
    </div>
  )
}

export function BillTable({ bills, baseCurrency, items, taxes, defaultDueDays }: { bills: Bill[]; baseCurrency: string; items?: any[]; taxes?: any[]; defaultDueDays?: number }) {
  const { visibleColumns } = useBillVisibility()

  // Filter columns based on user selection
  const dynamicColumns = useMemo(() => {
    return allColumns.filter((col) => visibleColumns.includes(col.key as BillColumnKey))
  }, [visibleColumns])

  return (
    <div className="space-y-4">
      <BillSearchAndFilters />

      <DataGrid
        data={bills}
        columns={dynamicColumns}
        getRowId={(row) => row.id}
        renderDetailSheet={(bill, onClose) => (
          <BillDetailSheet bill={bill} onClose={onClose} />
        )}
        emptyIcon={
          <Image 
            src="/empty-state.svg" 
            alt="No bills" 
            width={120} 
            height={120} 
            priority
          />
        }
        emptyTitle="Bills"
        emptyDescription="You don't seem to have any bills recorded yet. Every bill helps you maintain a clear cash flow."
        emptyActions={
          <NewBillSheet baseCurrency={baseCurrency} items={items} taxes={taxes} defaultDueDays={defaultDueDays}>
            <Button className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Record bill
            </Button>
          </NewBillSheet>
        }
      />
    </div>
  )
}


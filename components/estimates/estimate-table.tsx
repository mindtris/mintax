"use client"

import { deleteInvoiceAction, markInvoicePaidAction } from "@/app/(app)/invoices/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid, DataGridColumn } from "@/components/ui/data-grid"
import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { formatDate } from "date-fns"
import { CheckCircle, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  expired: "destructive",
  cancelled: "outline",
}

function formatAmount(amount: number, currency: string) {
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
}

interface Estimate {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail?: string | null
  clientAddress?: string | null
  clientTaxId?: string | null
  type: string
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

const columns: DataGridColumn<Estimate>[] = [
  {
    key: "invoiceNumber",
    label: "Estimate #",
    className: "font-medium",
    sortable: true,
  },
  {
    key: "clientName",
    label: "Client",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (estimate) => (
      <Badge variant={statusVariant[estimate.status] || "outline"} className="capitalize">
        {estimate.status}
      </Badge>
    ),
  },
  {
    key: "issuedAt",
    label: "Issued",
    sortable: true,
    render: (estimate) =>
      estimate.issuedAt ? formatDate(new Date(estimate.issuedAt), "MMM dd, yyyy") : "-",
  },
  {
    key: "dueAt",
    label: "Expiry",
    sortable: true,
    render: (estimate) =>
      estimate.dueAt ? formatDate(new Date(estimate.dueAt), "MMM dd, yyyy") : "-",
  },
  {
    key: "total",
    label: "Total",
    align: "right",
    className: "font-medium",
    sortable: true,
    render: (estimate) => formatAmount(estimate.total, estimate.currency),
  },
]

function EstimateDetailSheet({ estimate, onClose }: { estimate: Estimate; onClose: () => void }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkAccepted = async () => {
    setIsLoading(true)
    try {
      // For now we reuse markInvoicePaid to update status but ideally we'd have a markAcceptedAction
      // For MVP we'll just use markInvoicePaid which sets status="paid" 
      // but in real app we'd want status="accepted"
      await markInvoicePaidAction(estimate.id)
      router.refresh()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this estimate?")) return
    setIsLoading(true)
    try {
      await deleteInvoiceAction(estimate.id)
      router.refresh()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="shrink-0 pb-4">
        <SheetTitle className="flex items-center gap-2">
          {estimate.invoiceNumber}
          <Badge variant={statusVariant[estimate.status] || "outline"} className="capitalize">
            {estimate.status}
          </Badge>
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto space-y-6 py-4">
        {/* Client info */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Client</h4>
          <div className="space-y-1">
            <p className="font-medium">{estimate.clientName}</p>
            {estimate.clientEmail && <p className="text-sm text-muted-foreground">{estimate.clientEmail}</p>}
            {estimate.clientAddress && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{estimate.clientAddress}</p>
            )}
            {estimate.clientTaxId && (
              <p className="text-sm text-muted-foreground">Tax ID: {estimate.clientTaxId}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Issued</p>
            <p className="font-medium">
              {estimate.issuedAt ? formatDate(new Date(estimate.issuedAt), "MMM dd, yyyy") : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expiry</p>
            <p className="font-medium">
              {estimate.dueAt ? formatDate(new Date(estimate.dueAt), "MMM dd, yyyy") : "-"}
            </p>
          </div>
        </div>

        {/* Amounts */}
        <div className="space-y-2">
          {estimate.subtotal !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatAmount(estimate.subtotal, estimate.currency)}</span>
            </div>
          )}
          {estimate.taxTotal !== undefined && estimate.taxTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatAmount(estimate.taxTotal, estimate.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-1">
            <span>Total</span>
            <span>{formatAmount(estimate.total, estimate.currency)}</span>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-sm whitespace-pre-line">{estimate.notes}</p>
          </div>
        )}
      </div>

      <SheetFooter className="shrink-0 pt-4 mt-2">
        <div className="flex flex-col gap-2 w-full">
          {estimate.status === "draft" || estimate.status === "sent" && (
            <Button onClick={handleMarkAccepted} disabled={isLoading} className="w-full">
              <CheckCircle className="h-4 w-4" />
              Mark as Accepted
            </Button>
          )}
          <div className="flex gap-2">
            <Link href={`/invoices/${estimate.id}`} className="flex-1">
              <Button variant="outline" className="w-full" onClick={onClose}>
                <ExternalLink className="h-4 w-4" />
                Open Full View
              </Button>
            </Link>
            <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetFooter>
    </div>
  )
}

export function EstimateTable({ estimates }: { estimates: Estimate[] }) {
  return (
    <DataGrid
      data={estimates}
      columns={columns}
      getRowId={(row) => row.id}
      renderDetailSheet={(estimate, onClose) => (
        <EstimateDetailSheet estimate={estimate} onClose={onClose} />
      )}
    />
  )
}

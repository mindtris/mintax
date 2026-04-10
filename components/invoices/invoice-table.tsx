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
  paid: "default",
  overdue: "destructive",
  cancelled: "outline",
}

function formatAmount(amount: number, currency: string) {
  return (amount / 100).toLocaleString("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
}

interface Invoice {
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

const columns: DataGridColumn<Invoice>[] = [
  {
    key: "invoiceNumber",
    label: "Invoice #",
    className: "font-medium",
    sortable: true,
  },
  {
    key: "clientName",
    label: "Client",
    sortable: true,
  },
  {
    key: "type",
    label: "Type",
    className: "capitalize",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (invoice) => (
      <Badge variant={statusVariant[invoice.status] || "outline"} className="capitalize">
        {invoice.status}
      </Badge>
    ),
  },
  {
    key: "issuedAt",
    label: "Issued",
    sortable: true,
    render: (invoice) =>
      invoice.issuedAt ? formatDate(new Date(invoice.issuedAt), "MMM dd, yyyy") : "-",
  },
  {
    key: "dueAt",
    label: "Due",
    sortable: true,
    render: (invoice) =>
      invoice.dueAt ? formatDate(new Date(invoice.dueAt), "MMM dd, yyyy") : "-",
  },
  {
    key: "total",
    label: "Total",
    align: "right",
    className: "font-medium",
    sortable: true,
    render: (invoice) => formatAmount(invoice.total, invoice.currency),
  },
]

function InvoiceDetailSheet({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkPaid = async () => {
    setIsLoading(true)
    try {
      await markInvoicePaidAction(invoice.id)
      router.refresh()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) return
    setIsLoading(true)
    try {
      await deleteInvoiceAction(invoice.id)
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
          {invoice.invoiceNumber}
          <Badge variant={statusVariant[invoice.status] || "outline"} className="capitalize">
            {invoice.status}
          </Badge>
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto space-y-6 py-4">
        {/* Client info */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Client</h4>
          <div className="space-y-1">
            <p className="font-medium">{invoice.clientName}</p>
            {invoice.clientEmail && <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>}
            {invoice.clientAddress && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.clientAddress}</p>
            )}
            {invoice.clientTaxId && (
              <p className="text-sm text-muted-foreground">Tax ID: {invoice.clientTaxId}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Issued</p>
            <p className="font-medium">
              {invoice.issuedAt ? formatDate(new Date(invoice.issuedAt), "MMM dd, yyyy") : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due</p>
            <p className="font-medium">
              {invoice.dueAt ? formatDate(new Date(invoice.dueAt), "MMM dd, yyyy") : "-"}
            </p>
          </div>
          {invoice.paidAt && (
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="font-medium text-green-600">
                {formatDate(new Date(invoice.paidAt), "MMM dd, yyyy")}
              </p>
            </div>
          )}
        </div>

        {/* Amounts */}
        <div className="space-y-2">
          {invoice.subtotal !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatAmount(invoice.subtotal, invoice.currency)}</span>
            </div>
          )}
          {invoice.taxTotal !== undefined && invoice.taxTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatAmount(invoice.taxTotal, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-1">
            <span>Total</span>
            <span>{formatAmount(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>

      <SheetFooter className="shrink-0 pt-4 mt-2">
        <div className="flex flex-col gap-2 w-full">
          {invoice.status !== "paid" && (
            <Button onClick={handleMarkPaid} disabled={isLoading} className="w-full">
              <CheckCircle className="h-4 w-4" />
              Mark as Paid
            </Button>
          )}
          <div className="flex gap-2">
            <Link href={`/invoices/${invoice.id}`} className="flex-1">
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

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <DataGrid
      data={invoices}
      columns={columns}
      getRowId={(row) => row.id}
      renderDetailSheet={(invoice, onClose) => (
        <InvoiceDetailSheet invoice={invoice} onClose={onClose} />
      )}
    />
  )
}

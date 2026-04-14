"use client"

import { InvoicesTable } from "./invoices-table"
import { SalesSearchAndFilters } from "./filters"
import { NewInvoiceSheet } from "@/components/invoices/new-invoice-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const ALL_COLUMNS = [
  { key: "invoiceNumber", label: "Invoice" },
  { key: "status", label: "Status" },
  { key: "issuedAt", label: "Issued" },
  { key: "total", label: "Amount" },
  { key: "actions", label: "" },
]

export function InvoicesViewClient({
  invoices,
  total,
  stats,
  baseCurrency = "INR",
  taxId = "",
  invoiceSettings = {},
  currencies = [],
  items = [],
  taxes = [],
}: {
  invoices: any[]
  total: number
  stats: any
  baseCurrency?: string
  taxId?: string
  invoiceSettings?: Record<string, string>
  currencies?: { code: string; name: string }[]
  items?: { id: string; name: string; salePrice: number }[]
  taxes?: { id: string; name: string; rate: number; type: string }[]
}) {
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map((c) => c.key))

  const toggleColumn = (key: string) => {
    if (key === "invoiceNumber") return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Invoices</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-border/50 border shadow-sm">
            {total}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/import/csv">Import</Link>
          </Button>
          <NewInvoiceSheet
            baseCurrency={baseCurrency}
            taxId={taxId}
            invoiceSettings={invoiceSettings}
            currencies={currencies}
            items={items}
            taxes={taxes}
          >
            <Button>
              <Plus className="h-4 w-4" />
              <span className="hidden md:block">New invoice</span>
            </Button>
          </NewInvoiceSheet>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Outstanding</div>
            <div className="text-2xl font-bold mt-1 font-mono">
              {(stats.outstanding.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-destructive">Overdue</div>
            <div className="text-2xl font-bold text-destructive mt-1 font-mono">
              {(stats.overdue.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-emerald-600">Paid</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
              {(stats.paid.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <SalesSearchAndFilters
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
      />

      <InvoicesTable invoices={invoices} visibleColumns={visibleColumns} />
    </div>
  )
}

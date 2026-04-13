"use client"

import { BulkActionsMenu } from "@/components/transactions/bulk-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { calcNetTotalPerCurrency, calcTotalPerCurrency, isTransactionIncomplete } from "@/lib/stats"
import { cn, formatCurrency } from "@/lib/utils"
import { BankAccount, Category, ChartAccount, Contact, Field, Project, Transaction } from "@/lib/prisma/client"
import { formatDate } from "date-fns"
import { Bot, CheckCircle2, Circle, ExternalLink, File, Hash, Sparkles, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"

type FieldRenderer = {
  name: string
  code: string
  classes?: string
  sortable: boolean
  formatValue?: (transaction: Transaction & any) => React.ReactNode
  footerValue?: (transactions: Transaction[]) => React.ReactNode
}

type FieldWithRenderer = Field & {
  renderer: FieldRenderer
}

export const standardFieldRenderers: Record<string, FieldRenderer> = {
  name: {
    name: "Name",
    code: "name",
    classes: "font-medium min-w-[120px] max-w-[300px] overflow-hidden",
    sortable: true,
  },
  merchant: {
    name: "Merchant",
    code: "merchant",
    classes: "min-w-[120px] max-w-[250px] overflow-hidden",
    sortable: true,
  },
  issuedAt: {
    name: "Date",
    code: "issuedAt",
    classes: "min-w-[100px]",
    sortable: true,
    formatValue: (transaction: Transaction) =>
      transaction.issuedAt ? formatDate(transaction.issuedAt, "yyyy-MM-dd") : "",
  },
  projectCode: {
    name: "Project",
    code: "projectCode",
    sortable: true,
    formatValue: (transaction: Transaction & { project: Project }) =>
      transaction.projectCode ? (
        <Badge className="whitespace-nowrap" style={{ backgroundColor: transaction.project?.color }}>
          {transaction.project?.name || ""}
        </Badge>
      ) : (
        "-"
      ),
  },
  categoryCode: {
    name: "Category",
    code: "categoryCode",
    sortable: true,
    formatValue: (transaction: Transaction & { category: Category }) =>
      transaction.categoryCode ? (
        <Badge className="whitespace-nowrap" style={{ backgroundColor: transaction.category?.color }}>
          {transaction.category?.name || ""}
        </Badge>
      ) : (
        "-"
      ),
  },
  files: {
    name: "Files",
    code: "files",
    sortable: false,
    formatValue: (transaction: Transaction) => (
      <div className="flex items-center gap-2 text-sm">
        <File className="w-4 h-4" />
        {(transaction.files as string[]).length}
      </div>
    ),
  },
  total: {
    name: "Total",
    code: "total",
    classes: "text-right",
    sortable: true,
    formatValue: (transaction: Transaction) => (
      <div className="text-right text-lg">
        <div
          className={cn(
            { income: "text-green-500", expense: "text-red-500", other: "text-foreground" }[transaction.type || "other"],
            "flex flex-col justify-end"
          )}
        >
          <span>
            {transaction.total && transaction.currencyCode
              ? formatCurrency(transaction.total, transaction.currencyCode)
              : transaction.total}
          </span>
          {transaction.convertedTotal &&
            transaction.convertedCurrencyCode &&
            transaction.convertedCurrencyCode !== transaction.currencyCode && (
              <span className="text-sm -mt-1">
                ({formatCurrency(transaction.convertedTotal, transaction.convertedCurrencyCode)})
              </span>
            )}
        </div>
      </div>
    ),
    footerValue: (transactions: Transaction[]) => {
      const netTotalPerCurrency = calcNetTotalPerCurrency(transactions)
      const turnoverPerCurrency = calcTotalPerCurrency(transactions.filter((transaction) => transaction.type === 'income'))

      return (
        <div className="flex flex-col gap-3 text-right">
          <dl className="space-y-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Net Total</dt>
            {Object.entries(netTotalPerCurrency).map(([currency, total]) => (
              <dd
                key={`net-${currency}`}
                className={cn("text-sm first:text-base font-medium", total >= 0 ? "text-green-600" : "text-red-600")}
              >
                {formatCurrency(total, currency)}
              </dd>
            ))}
          </dl>
          <dl className="space-y-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Turnover</dt>
            {Object.entries(turnoverPerCurrency).map(([currency, total]) => (
              <dd key={`turnover-${currency}`} className="text-sm text-muted-foreground">
                {formatCurrency(total, currency)}
              </dd>
            ))}
          </dl>
        </div>
      )
    },
  },
  convertedTotal: {
    name: "Converted Total",
    code: "convertedTotal",
    classes: "text-right",
    sortable: true,
    formatValue: (transaction: Transaction) => (
      <div
        className={cn(
          { income: "text-green-500", expense: "text-red-500", other: "text-foreground" }[transaction.type || "other"],
          "flex flex-col justify-end text-right text-lg"
        )}
      >
        {transaction.convertedTotal && transaction.convertedCurrencyCode
          ? formatCurrency(transaction.convertedTotal, transaction.convertedCurrencyCode)
          : transaction.convertedTotal}
      </div>
    ),
  },
  currencyCode: {
    name: "Currency",
    code: "currencyCode",
    classes: "text-right",
    sortable: true,
  },
  number: {
    name: "Number",
    code: "number",
    classes: "min-w-[110px] font-mono text-xs text-muted-foreground",
    sortable: true,
    formatValue: (transaction: Transaction) =>
      transaction.number ? (
        <span className="inline-flex items-center gap-1">
          <Hash className="h-3 w-3 shrink-0 opacity-50" />
          {transaction.number}
        </span>
      ) : (
        "-"
      ),
  },
  contactId: {
    name: "Vendor",
    code: "contactId",
    classes: "min-w-[140px] max-w-[220px] overflow-hidden",
    sortable: false,
    formatValue: (transaction: Transaction & { contact?: Contact | null }) =>
      transaction.contact?.name ? (
        <span className="truncate text-sm">{transaction.contact.name}</span>
      ) : transaction.merchant ? (
        <span className="text-sm text-muted-foreground italic">{transaction.merchant}</span>
      ) : (
        "-"
      ),
  },
  chartAccountId: {
    name: "Chart account",
    code: "chartAccountId",
    classes: "min-w-[160px] max-w-[240px] overflow-hidden",
    sortable: false,
    formatValue: (transaction: Transaction & { chartAccount?: ChartAccount | null }) =>
      transaction.chartAccount ? (
        <span className="text-xs font-mono">
          <span className="text-muted-foreground">{transaction.chartAccount.code}</span>{" "}
          {transaction.chartAccount.name}
        </span>
      ) : (
        "-"
      ),
  },
  bankAccountId: {
    name: "Account",
    code: "bankAccountId",
    classes: "min-w-[120px] max-w-[200px] overflow-hidden",
    sortable: true,
    formatValue: (transaction: Transaction & { bankAccount?: BankAccount | null }) =>
      transaction.bankAccount ? (
        <span className="text-xs">
          {transaction.bankAccount.name}
          {transaction.bankAccount.currency ? (
            <span className="text-muted-foreground"> ({transaction.bankAccount.currency})</span>
          ) : null}
        </span>
      ) : (
        "-"
      ),
  },
  status: {
    name: "Status",
    code: "status",
    classes: "min-w-[110px]",
    sortable: true,
    formatValue: (transaction: Transaction) => {
      const status = (transaction as any).status || "posted"
      const styles: Record<string, string> = {
        posted: "bg-green-500/10 text-green-700 border-green-500/20",
        needs_review: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        draft: "bg-muted text-muted-foreground border-border",
      }
      const labels: Record<string, string> = {
        posted: "Posted",
        needs_review: "Needs review",
        draft: "Draft",
      }
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wide",
            styles[status] || styles.posted,
          )}
        >
          {labels[status] || status}
        </span>
      )
    },
  },
  reconciled: {
    name: "Reconciled",
    code: "reconciled",
    classes: "text-center w-[90px]",
    sortable: true,
    formatValue: (transaction: Transaction) =>
      transaction.reconciled ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
      ),
  },
  source: {
    name: "Source",
    code: "source",
    classes: "min-w-[80px]",
    sortable: true,
    formatValue: (transaction: Transaction) => {
      const source = (transaction as any).source || "manual"
      const config: Record<string, { icon: any; label: string; className: string }> = {
        manual: { icon: null, label: "Manual", className: "text-muted-foreground" },
        ai: { icon: Sparkles, label: "AI", className: "text-purple-600" },
        plaid: { icon: Upload, label: "Plaid", className: "text-blue-600" },
        csv: { icon: Upload, label: "CSV", className: "text-cyan-600" },
        bank: { icon: Upload, label: "Bank", className: "text-blue-600" },
      }
      const c = config[source] || config.manual
      const Icon = c.icon
      return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] uppercase font-medium", c.className)}>
          {Icon && <Icon className="h-3 w-3" />}
          {c.label}
        </span>
      )
    },
  },
  paymentMethod: {
    name: "Payment method",
    code: "paymentMethod",
    classes: "min-w-[120px]",
    sortable: true,
    formatValue: (transaction: Transaction) => {
      const method = (transaction as any).paymentMethod
      if (!method) return "-"
      const labels: Record<string, string> = {
        cash: "Cash",
        bank_transfer: "Bank transfer",
        upi: "UPI",
        card: "Card",
        cheque: "Cheque",
        other: "Other",
      }
      return <span className="text-xs">{labels[method] || method}</span>
    },
  },
  reference: {
    name: "Reference",
    code: "reference",
    classes: "min-w-[110px] max-w-[180px] overflow-hidden font-mono text-xs",
    sortable: false,
    formatValue: (transaction: Transaction) =>
      (transaction as any).reference ? (
        <span className="truncate">{(transaction as any).reference}</span>
      ) : (
        "-"
      ),
  },
  taxAmount: {
    name: "Tax",
    code: "taxAmount",
    classes: "text-right min-w-[90px]",
    sortable: true,
    formatValue: (transaction: Transaction) => {
      const amt = (transaction as any).taxAmount
      if (!amt) return "-"
      return (
        <span className="text-xs text-muted-foreground">
          {formatCurrency(amt, transaction.currencyCode || "INR")}
        </span>
      )
    },
  },
  taxRate: {
    name: "Tax rate",
    code: "taxRate",
    classes: "min-w-[90px] text-xs",
    sortable: false,
    formatValue: (transaction: Transaction) => {
      const rate = (transaction as any).taxRate
      return rate ? <span className="text-xs">{rate}</span> : "-"
    },
  },
  createdAt: {
    name: "Created",
    code: "createdAt",
    classes: "min-w-[100px] text-xs text-muted-foreground",
    sortable: true,
    formatValue: (transaction: Transaction) =>
      transaction.createdAt ? formatDate(transaction.createdAt, "yyyy-MM-dd") : "-",
  },
  updatedAt: {
    name: "Last modified",
    code: "updatedAt",
    classes: "min-w-[100px] text-xs text-muted-foreground",
    sortable: true,
    formatValue: (transaction: Transaction) =>
      transaction.updatedAt ? formatDate(transaction.updatedAt, "yyyy-MM-dd") : "-",
  },
}

const getFieldRenderer = (field: Field): FieldRenderer => {
  if (standardFieldRenderers[field.code as keyof typeof standardFieldRenderers]) {
    return standardFieldRenderers[field.code as keyof typeof standardFieldRenderers]
  } else {
    return {
      name: field.name,
      code: field.code,
      classes: "",
      sortable: false,
    }
  }
}

const typeLabels: Record<string, { label: string; color: string }> = {
  expense: { label: "Expense", color: "text-red-500" },
  income: { label: "Income", color: "text-green-500" },
  pending: { label: "Pending", color: "text-yellow-500" },
  other: { label: "Other", color: "text-muted-foreground" },
}

function TransactionDetailSheet({
  transaction,
  fields,
  onClose,
}: {
  transaction: Transaction & {
    category?: Category
    project?: Project
    contact?: Contact | null
    chartAccount?: ChartAccount | null
    bankAccount?: BankAccount | null
  }
  fields: Field[]
  onClose: () => void
}) {
  const typeInfo = typeLabels[transaction.type || "other"] ?? typeLabels.other
  const incompleteFields = fields.filter(
    (f) => f.isRequired && !transaction[f.code as keyof Transaction] && !(transaction.extra as any)?.[f.code]
  )

  const status = (transaction as any).status || "posted"
  const source = (transaction as any).source || "manual"
  const aiConfidence = (transaction as any).aiConfidence as Record<string, number> | null
  const lowConfidenceFields = aiConfidence
    ? Object.entries(aiConfidence)
        .filter(([, c]) => c < 0.8)
        .map(([k]) => k)
    : []

  const statusBadge: Record<string, string> = {
    posted: "bg-green-500/10 text-green-700 border-green-500/20",
    needs_review: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    draft: "bg-muted text-muted-foreground border-border",
  }
  const statusLabel: Record<string, string> = {
    posted: "Posted",
    needs_review: "Needs review",
    draft: "Draft",
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="shrink-0 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-lg truncate">{transaction.name || "Untitled transaction"}</SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(transaction as any).number && (
                <span className="font-mono">{(transaction as any).number} &middot; </span>
              )}
              <span className={typeInfo.color}>{typeInfo.label}</span>
              {transaction.reconciled && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Reconciled
                </span>
              )}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wide",
              statusBadge[status] || statusBadge.posted,
            )}
          >
            {statusLabel[status] || status}
          </span>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto space-y-5 py-4">
        {/* Incomplete fields warning */}
        {incompleteFields.length > 0 && (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-700">
            Missing required fields: <strong>{incompleteFields.map((f) => f.name).join(", ")}</strong>
          </div>
        )}

        {/* Low-confidence AI fields */}
        {lowConfidenceFields.length > 0 && (
          <div className="rounded-md bg-purple-500/10 border border-purple-500/20 p-3 text-sm text-purple-700">
            <div className="flex items-center gap-1 font-medium">
              <Sparkles className="h-3.5 w-3.5" /> AI extracted these with low confidence
            </div>
            <p className="text-xs mt-1">{lowConfidenceFields.join(", ")} — please double-check before posting.</p>
          </div>
        )}

        {/* Amount */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount</p>
          <p className={cn("text-2xl font-bold", typeInfo.color)}>
            {transaction.total && transaction.currencyCode
              ? formatCurrency(transaction.total, transaction.currencyCode)
              : String(transaction.total ?? "-")}
          </p>
          {transaction.convertedTotal &&
            transaction.convertedCurrencyCode &&
            transaction.convertedCurrencyCode !== transaction.currencyCode && (
              <p className="text-sm text-muted-foreground">
                Converted: {formatCurrency(transaction.convertedTotal, transaction.convertedCurrencyCode)}
              </p>
            )}
        </div>

        {/* Key details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
            <p className="text-sm font-medium">
              {transaction.issuedAt ? formatDate(transaction.issuedAt, "MMM dd, yyyy") : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Currency</p>
            <p className="text-sm font-medium">{transaction.currencyCode || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendor</p>
            <p className="text-sm font-medium">
              {transaction.contact?.name || transaction.merchant || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Account</p>
            <p className="text-sm font-medium">
              {transaction.bankAccount?.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
            {transaction.categoryCode && (transaction as any).category ? (
              <Badge
                className="whitespace-nowrap"
                style={{ backgroundColor: (transaction as any).category?.color }}
              >
                {(transaction as any).category?.name}
              </Badge>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">-</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Chart account</p>
            <p className="text-sm font-medium">
              {transaction.chartAccount ? (
                <span className="font-mono text-xs">
                  {transaction.chartAccount.code} {transaction.chartAccount.name}
                </span>
              ) : (
                "-"
              )}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Project</p>
            {transaction.projectCode && (transaction as any).project ? (
              <Badge
                className="whitespace-nowrap"
                style={{ backgroundColor: (transaction as any).project?.color }}
              >
                {(transaction as any).project?.name}
              </Badge>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">-</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment method</p>
            <p className="text-sm font-medium">{(transaction as any).paymentMethod || "-"}</p>
          </div>
          {(transaction as any).taxRate && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tax</p>
              <p className="text-sm font-medium">
                {(transaction as any).taxRate}
                {(transaction as any).taxAmount
                  ? ` · ${formatCurrency((transaction as any).taxAmount, transaction.currencyCode || "INR")}`
                  : ""}
              </p>
            </div>
          )}
          {(transaction as any).reference && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference</p>
              <p className="text-sm font-medium font-mono">{(transaction as any).reference}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {transaction.description && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{transaction.description}</p>
          </div>
        )}

        {/* Note */}
        {transaction.note && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Note</p>
            <p className="text-sm whitespace-pre-line">{transaction.note}</p>
          </div>
        )}

        {/* Files count */}
        {transaction.files && (transaction.files as string[]).length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <File className="h-4 w-4" />
            {(transaction.files as string[]).length} file(s) attached
          </div>
        )}

        {/* Linked invoice */}
        {transaction.invoiceId && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Linked invoice</p>
            <Link href={`/invoices/${transaction.invoiceId}`} className="text-sm text-primary hover:underline">
              View invoice →
            </Link>
          </div>
        )}

        {/* Audit trail */}
        <div className="pt-4 border-t border-border/50 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Audit trail</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="opacity-60">Source:</span>{" "}
              <span className="font-medium uppercase">{source}</span>
            </div>
            <div>
              <span className="opacity-60">Status:</span>{" "}
              <span className="font-medium">{statusLabel[status] || status}</span>
            </div>
            {transaction.createdAt && (
              <div>
                <span className="opacity-60">Created:</span>{" "}
                <span className="font-medium">{formatDate(transaction.createdAt, "MMM dd, yyyy HH:mm")}</span>
              </div>
            )}
            {transaction.updatedAt && (
              <div>
                <span className="opacity-60">Modified:</span>{" "}
                <span className="font-medium">{formatDate(transaction.updatedAt, "MMM dd, yyyy HH:mm")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <SheetFooter className="shrink-0 pt-4 mt-2">
        <Link href={`/transactions/${transaction.id}`} className="w-full">
          <Button className="w-full" onClick={onClose}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open & edit
          </Button>
        </Link>
      </SheetFooter>
    </div>
  )
}

export function TransactionList({
  transactions,
  fields = [],
}: {
  transactions: Transaction[];
  fields?: Field[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sorting, setSorting] = useState<SortState>(() => {
    const ordering = searchParams.get("ordering")
    if (!ordering) return { field: null, direction: null }
    const isDesc = ordering.startsWith("-")
    return {
      field: isDesc ? ordering.slice(1) : ordering,
      direction: isDesc ? "desc" : "asc",
    }
  })

  const visibleFields = useMemo(
    (): FieldWithRenderer[] =>
      fields
        .filter((field) => field.isVisibleInList)
        .map((field) => ({
          ...field,
          renderer: getFieldRenderer(field),
        })),
    [fields]
  )

  // Convert visible fields to DataGrid columns
  const gridColumns = useMemo(
    (): DataGridColumn<Transaction>[] =>
      visibleFields.map((field) => ({
        key: field.code,
        label: field.name || field.renderer.name,
        className: field.renderer.classes,
        sortable: field.renderer.sortable,
        render: (transaction: Transaction) => {
          if (field.isExtra) {
            return String(transaction.extra?.[field.code as keyof typeof transaction.extra] ?? "")
          } else if (field.renderer.formatValue) {
            return field.renderer.formatValue(transaction)
          } else {
            return String(transaction[field.code as keyof Transaction] ?? "")
          }
        },
        footer: field.renderer.footerValue
          ? (rows: Transaction[]) => field.renderer.footerValue!(rows)
          : undefined,
      })),
    [visibleFields]
  )

  // Sync sorting to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "transactions")
    if (sorting.field && sorting.direction) {
      const ordering = sorting.direction === "desc" ? `-${sorting.field}` : sorting.field
      params.set("ordering", ordering)
    } else {
      params.delete("ordering")
    }
    router.push(`/accounts?${params.toString()}`, { scroll: false })
  }, [sorting])

  return (
    <>
      <DataGrid
        data={transactions}
        columns={gridColumns}
        getRowId={(row) => row.id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sort={sorting}
        onSortChange={setSorting}
        renderDetailSheet={(transaction, onClose) => (
          <TransactionDetailSheet
            transaction={transaction}
            fields={fields}
            onClose={onClose}
          />
        )}
        rowHighlight={(transaction) => isTransactionIncomplete(fields, transaction)}
        emptyIcon={
          <Image 
            src="/empty-state.svg" 
            alt="No transactions" 
            width={120} 
            height={120} 
            priority
          />
        }
        emptyTitle="Transactions"
        emptyDescription="No transactions yet. Create your first one to get started."
      />
      {selectedIds.length > 0 && (
        <BulkActionsMenu selectedIds={selectedIds} onActionComplete={() => setSelectedIds([])} />
      )}
    </>
  )
}

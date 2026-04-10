"use client"

import { BulkActionsMenu } from "@/components/transactions/bulk-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { calcNetTotalPerCurrency, calcTotalPerCurrency, isTransactionIncomplete } from "@/lib/stats"
import { cn, formatCurrency } from "@/lib/utils"
import { Category, Field, Project, Transaction } from "@/lib/prisma/client"
import { formatDate } from "date-fns"
import { ExternalLink, File } from "lucide-react"
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
  transaction: Transaction & { category?: Category; project?: Project }
  fields: Field[]
  onClose: () => void
}) {
  const typeInfo = typeLabels[transaction.type || "other"] ?? typeLabels.other
  const incompleteFields = fields.filter(
    (f) => f.isRequired && !transaction[f.code as keyof Transaction] && !(transaction.extra as any)?.[f.code]
  )

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="shrink-0 pb-4">
        <SheetTitle className="text-lg">{transaction.name || "Untitled transaction"}</SheetTitle>
        <p className="text-sm text-muted-foreground">
          {transaction.merchant && <span>{transaction.merchant} &middot; </span>}
          <span className={typeInfo.color}>{typeInfo.label}</span>
        </p>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto space-y-5 py-4">
        {/* Incomplete fields warning */}
        {incompleteFields.length > 0 && (
          <div className="rounded-md bg-muted p-3 text-sm">
            Missing: <strong>{incompleteFields.map((f) => f.name).join(", ")}</strong>
          </div>
        )}

        {/* Amount */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Amount</p>
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
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">
              {transaction.issuedAt ? formatDate(transaction.issuedAt, "MMM dd, yyyy") : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="font-medium">{transaction.currencyCode || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            {transaction.categoryCode && (transaction as any).category ? (
              <Badge
                className="whitespace-nowrap"
                style={{ backgroundColor: (transaction as any).category?.color }}
              >
                {(transaction as any).category?.name}
              </Badge>
            ) : (
              <p className="font-medium text-muted-foreground">-</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Project</p>
            {transaction.projectCode && (transaction as any).project ? (
              <Badge
                className="whitespace-nowrap"
                style={{ backgroundColor: (transaction as any).project?.color }}
              >
                {(transaction as any).project?.name}
              </Badge>
            ) : (
              <p className="font-medium text-muted-foreground">-</p>
            )}
          </div>
        </div>

        {/* Description */}
        {transaction.description && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{transaction.description}</p>
          </div>
        )}

        {/* Note */}
        {transaction.note && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Note</p>
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
      </div>

      <SheetFooter className="shrink-0 pt-4 mt-2">
        <Link href={`/transactions/${transaction.id}`} className="w-full">
          <Button className="w-full" onClick={onClose}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open & Edit
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

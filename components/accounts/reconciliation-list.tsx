"use client"

import { Badge } from "@/components/ui/badge"
import { DataGrid } from "@/components/ui/data-grid"
import { BankAccount } from "@/lib/prisma/client"
import { Landmark } from "lucide-react"
import Image from "next/image"
import { useMemo } from "react"
import { useBankAccountVisibility, BankAccountColumnKey } from "@/lib/hooks/use-bank-account-visibility"
import { useBankAccountFilters } from "@/lib/hooks/use-bank-account-filters"
import { BankAccountSearchAndFilters, ACCOUNT_TYPE_LABELS } from "@/components/bank-accounts/filters"

export function ReconciliationList({ accounts }: { accounts: BankAccount[] }) {
  const { visibleColumns, toggleColumn } = useBankAccountVisibility()
  const [filters, setFilters] = useBankAccountFilters()

  const allColumns = useMemo(() => [
    {
      key: "name",
      label: "Account",
      render: (account: BankAccount) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{account.name}</span>
            {account.bankName && (
              <span className="text-[11px] text-muted-foreground">{account.bankName}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "accountNumber",
      label: "Account number",
      render: (account: BankAccount) => {
        const num = account.accountNumber
        if (!num) return <span className="text-muted-foreground italic text-xs">Not set</span>
        return <code className="text-[11px] bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">****{num.slice(-4)}</code>
      },
    },
    {
      key: "accountType",
      label: "Type",
      render: (account: BankAccount) => (
        <Badge variant="outline" className="capitalize text-[10px] font-medium border-border bg-black/[0.02]">
          {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}
        </Badge>
      ),
    },
    {
      key: "currentBalance",
      label: "Balance",
      render: (account: BankAccount) => {
        const amount = (account.currentBalance / 100).toLocaleString("en-US", {
          style: "currency",
          currency: account.currency,
          minimumFractionDigits: 2,
        })
        return <span className="font-mono font-bold text-foreground">{amount}</span>
      },
    },
  ], [])

  const dynamicColumns = useMemo(() => {
    return allColumns.filter((col) => visibleColumns.includes(col.key as BankAccountColumnKey))
  }, [visibleColumns, allColumns])

  return (
    <div className="space-y-4">
      <BankAccountSearchAndFilters
        filters={filters}
        setFilters={setFilters}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
      />

      <DataGrid
        data={accounts}
        columns={dynamicColumns}
        onRowClick={(account) => {
          window.location.href = `/reconciliation/${account.id}`
        }}
        emptyIcon={
          <Image
            src="/empty-state.svg"
            alt="No accounts to reconcile"
            width={120}
            height={120}
            priority
          />
        }
        emptyTitle="Reconciliation"
        emptyDescription="No bank accounts to reconcile. Add a bank account to get started."
      />
    </div>
  )
}

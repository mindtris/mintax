"use client"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ColumnsIcon } from "lucide-react"
import { BankAccountColumnKey } from "@/lib/hooks/use-bank-account-visibility"

const COLUMNS: { key: BankAccountColumnKey; label: string }[] = [
  { key: "name", label: "Account" },
  { key: "accountNumber", label: "Account number" },
  { key: "accountType", label: "Type" },
  { key: "currentBalance", label: "Balance" },
]

export function BankAccountColumnSelector({
  visibleColumns,
  onToggle,
}: {
  visibleColumns: BankAccountColumnKey[]
  onToggle: (key: BankAccountColumnKey) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Select table columns">
          <ColumnsIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {COLUMNS.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={visibleColumns.includes(col.key)}
            onCheckedChange={() => onToggle(col.key)}
            disabled={col.key === "name"}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

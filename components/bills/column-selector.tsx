"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BillColumnKey, useBillVisibility } from "@/lib/hooks/use-bill-visibility"
import { ColumnsIcon } from "lucide-react"

const columns: { key: BillColumnKey; label: string }[] = [
  { key: "billNumber", label: "Bill #" },
  { key: "vendorName", label: "Vendor" },
  { key: "status", label: "Status" },
  { key: "issuedAt", label: "Issued Date" },
  { key: "dueAt", label: "Due Date" },
  { key: "total", label: "Total Amount" },
  { key: "paidAt", label: "Paid Date" },
]

export function BillColumnSelector() {
  const { visibleColumns, toggleColumn } = useBillVisibility()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Select table columns">
          <ColumnsIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={visibleColumns.includes(col.key)}
            onCheckedChange={() => toggleColumn(col.key)}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

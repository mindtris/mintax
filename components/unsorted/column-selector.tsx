"use client"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ColumnsIcon } from "lucide-react"
import { UnsortedFileColumnKey } from "@/lib/hooks/use-unsorted-file-visibility"

const COLUMNS: { key: UnsortedFileColumnKey; label: string }[] = [
  { key: "filename", label: "File name" },
  { key: "createdAt", label: "Uploaded" },
  { key: "size", label: "Size" },
  { key: "type", label: "Type" },
]

export function UnsortedFileColumnSelector({
  visibleColumns,
  onToggle,
}: {
  visibleColumns: UnsortedFileColumnKey[]
  onToggle: (key: UnsortedFileColumnKey) => void
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
            disabled={col.key === "filename"}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

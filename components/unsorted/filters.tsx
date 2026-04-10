"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { UnsortedFileFilters } from "@/lib/services/files"
import { isFiltered } from "@/lib/hooks/use-unsorted-file-filters"
import { UnsortedFileColumnSelector } from "./column-selector"
import { UnsortedFileColumnKey } from "@/lib/hooks/use-unsorted-file-visibility"

export function UnsortedSearchAndFilters({
  filters,
  setFilters,
  visibleColumns,
  toggleColumn,
}: {
  filters: UnsortedFileFilters
  setFilters: (f: UnsortedFileFilters) => void
  visibleColumns: UnsortedFileColumnKey[]
  toggleColumn: (key: UnsortedFileColumnKey) => void
}) {
  const handleFilterChange = (key: keyof UnsortedFileFilters, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {/* Search bar — always visible */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search filenames..."
            defaultValue={filters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFilterChange("search", (e.target as HTMLInputElement).value)
              }
            }}
            className="w-full"
          />
        </div>

        {/* Clear all — inline when filters active */}
        {isFiltered(filters) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilters({})}
            className="text-muted-foreground hover:text-foreground"
            title="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <UnsortedFileColumnSelector
          visibleColumns={visibleColumns}
          onToggle={toggleColumn}
        />
      </div>
    </div>
  )
}

"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Filter, Search, X } from "lucide-react"
import { useState } from "react"
import { BankAccountFilters } from "@/lib/services/bank-accounts"
import { isFiltered } from "@/lib/hooks/use-bank-account-filters"
import { BankAccountColumnSelector } from "./column-selector"
import { BankAccountColumnKey } from "@/lib/hooks/use-bank-account-visibility"

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit card",
  cash: "Cash",
  wallet: "Wallet",
}

export function BankAccountSearchAndFilters({
  filters,
  setFilters,
  visibleColumns,
  toggleColumn,
}: {
  filters: BankAccountFilters
  setFilters: (f: BankAccountFilters) => void
  visibleColumns: BankAccountColumnKey[]
  toggleColumn: (key: BankAccountColumnKey) => void
}) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const handleFilterChange = (key: keyof BankAccountFilters, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "search" && value !== "" && value !== "-"
  ).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {/* Search bar — always visible */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bank accounts..."
            defaultValue={filters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFilterChange("search", (e.target as HTMLInputElement).value)
              }
            }}
            className="w-full pl-9 bg-background/50"
          />
        </div>

        {/* Filter Sheet trigger */}
        <Button
          variant={activeFilterCount > 0 ? "default" : "outline"}
          onClick={() => setFilterSheetOpen(true)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

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

        <BankAccountColumnSelector
          visibleColumns={visibleColumns}
          onToggle={toggleColumn}
        />
      </div>

      {/* Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden border-black/[0.05] shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Account Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Type</label>
              <Select
                value={filters.accountType || "-"}
                onValueChange={(value) => handleFilterChange("accountType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All types</SelectItem>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button
                className="flex-1"
                onClick={() => setFilterSheetOpen(false)}
              >
                Apply
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setFilters({})
                  setFilterSheetOpen(false)
                }}
              >
                Clear All
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

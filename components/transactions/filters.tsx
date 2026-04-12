"use client"

import { DateRangePicker } from "@/components/forms/date-range-picker"
import { ColumnSelector } from "@/components/transactions/fields-selector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { isFiltered, useTransactionFilters } from "@/lib/hooks/use-transaction-filters"
import { TransactionFilters } from "@/lib/services/transactions"
import { Category, Field, Project } from "@/lib/prisma/client"
import { Filter, X, Search } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function TransactionSearchAndFilters({
  categories,
  projects,
  fields,
}: {
  categories: Category[]
  projects: Project[]
  fields: Field[]
}) {
  const [filters, setFilters] = useTransactionFilters()
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const handleFilterChange = (name: keyof TransactionFilters, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [name]: value,
    }))
  }

  const activeFilterCount = [
    filters.categoryCode && filters.categoryCode !== "-",
    filters.projectCode && filters.projectCode !== "-",
    filters.dateFrom || filters.dateTo,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {/* Search bar — always visible */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search financial records..."
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
          className="px-4 text-xs"
        >
          <Filter className="h-3.5 w-3.5 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
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

        <ColumnSelector fields={fields} />
      </div>

      {/* Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden border-border shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle className="font-display text-xl tracking-tight font-bold">Filters</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Classification</label>
              <Select
                value={filters.categoryCode || "-"}
                onValueChange={(value) => handleFilterChange("categoryCode", value)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.code || category.id} value={category.code || category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            {projects.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Allocation</label>
                <Select
                  value={filters.projectCode || "-"}
                  onValueChange={(value) => handleFilterChange("projectCode", value)}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">All projects</SelectItem>
                    {projects.map((project: any) => (
                      <SelectItem key={project.code} value={project.code}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Accounting Period</label>
              <DateRangePicker
                defaultDate={{
                  from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
                  to: filters.dateTo ? new Date(filters.dateTo) : undefined,
                }}
                onChange={(date) => {
                  handleFilterChange("dateFrom", date ? date.from : undefined)
                  handleFilterChange("dateTo", date ? date.to : undefined)
                }}
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 shrink-0 border-t bg-muted/20">
            <div className="flex gap-2 w-full">
              <Button
                className="flex-1 h-10 font-medium"
                onClick={() => setFilterSheetOpen(false)}
              >
                Apply filters
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 font-medium border-input"
                onClick={() => {
                  setFilters({})
                  setFilterSheetOpen(false)
                }}
              >
                Reset
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

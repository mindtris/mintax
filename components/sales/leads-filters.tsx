"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LEAD_SOURCES, SOURCE_LABELS } from "@/lib/services/leads"
import { ColumnsIcon, Filter, X, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type ColumnConfig = { key: string; label: string }

export function LeadsSearchAndFilters({
  columns = [],
  visibleColumns = [],
  onToggleColumn,
  categories = [],
}: {
  columns?: ColumnConfig[]
  visibleColumns?: string[]
  onToggleColumn?: (key: string) => void
  categories?: any[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const currentSearch = searchParams.get("search") || ""
  const currentStage = searchParams.get("stage") || "-"
  const currentSource = searchParams.get("source") || "-"

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "-") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const clearAll = () => {
    const params = new URLSearchParams()
    const tab = searchParams.get("tab")
    if (tab) params.set("tab", tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const activeFilterCount = [
    currentStage !== "-" && currentStage,
    currentSource !== "-" && currentSource,
  ].filter(Boolean).length

  const isFiltered = currentSearch || activeFilterCount > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            defaultValue={currentSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParam("search", (e.target as HTMLInputElement).value)
            }}
            className="w-full pl-9 bg-background/50"
          />
        </div>

        <Button
          variant={activeFilterCount > 0 ? "default" : "outline"}
          onClick={() => setFilterSheetOpen(true)}
          className="px-4 text-xs"
        >
          <Filter className="h-3.5 w-3.5 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{activeFilterCount}</Badge>
          )}
        </Button>

        {isFiltered && (
          <Button variant="ghost" size="icon" onClick={clearAll} className="text-muted-foreground hover:text-foreground" title="Clear all">
            <X className="h-4 w-4" />
          </Button>
        )}

        {columns.length > 0 && onToggleColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Select table columns">
                <ColumnsIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleColumns.includes(col.key)}
                  onCheckedChange={() => onToggleColumn(col.key)}
                  disabled={col.key === "title"}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Stage</label>
              <Select value={currentStage} onValueChange={(v) => updateParam("stage", v)}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All stages" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All stages</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Source</label>
              <Select value={currentSource} onValueChange={(v) => updateParam("source", v)}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All sources" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All sources</SelectItem>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>Apply</Button>
              <Button variant="outline" className="flex-1" onClick={() => { clearAll(); setFilterSheetOpen(false) }}>Clear all</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

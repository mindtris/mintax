"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid, DataGridColumn } from "@/components/ui/data-grid"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Columns3, Edit, EllipsisVertical, Filter, Plus, Search, Trash2, X } from "lucide-react"
import { useMemo, useState, useCallback } from "react"
import { Checkbox } from "@/components/ui/checkbox"

// ─── Types ──────────────────────────────────────────────────────────────────

interface CrudColumn<T> {
  key: keyof T
  label: string
  type?: "text" | "number" | "checkbox" | "select" | "color"
  options?: string[]
  complexOptions?: Array<{ label: string; value: string }>
  defaultValue?: string | boolean | number
  editable?: boolean
  /** Column can be used as a filter (select-based columns) */
  filterable?: boolean
}

interface CrudProps<T> {
  /** Page header title (renders header when provided) */
  title?: string
  /** Page header description */
  description?: string
  items: T[]
  columns: CrudColumn<T>[]
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
  onAdd: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onEdit?: (id: string, data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  searchPlaceholder?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CrudTable<T extends { [key: string]: any }>({
  title,
  description,
  items,
  columns,
  onDelete,
  onAdd,
  onEdit,
  searchPlaceholder,
}: CrudProps<T>) {
  const [search, setSearch] = useState("")
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [sheetMode, setSheetMode] = useState<"closed" | "add" | "edit">("closed")
  const [editingRow, setEditingRow] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Filterable columns (select-type)
  const filterableColumns = useMemo(
    () => columns.filter((c) => c.type === "select" && c.filterable !== false),
    [columns]
  )

  // Filtered data
  const filtered = useMemo(() => {
    let result = items
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((row) =>
        columns.some((col) => {
          if (col.type === "checkbox" || col.type === "color") return false
          const val = row[col.key]
          return val != null && String(val).toLowerCase().includes(q)
        })
      )
    }
    for (const [key, val] of Object.entries(filters)) {
      if (val && val !== "-") {
        result = result.filter((row) => String(row[key as keyof T]) === val)
      }
    }
    return result
  }, [items, search, filters, columns])

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "-").length
  const isFiltered = !!search || activeFilterCount > 0

  const clearAll = () => {
    setSearch("")
    setFilters({})
  }

  // Visible columns
  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenColumns.has(String(c.key))),
    [columns, hiddenColumns]
  )

  const toggleColumn = (key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // CRUD sheet helpers
  const editableColumns = useMemo(
    () => columns.filter((col) => col.editable),
    [columns]
  )

  const openAddSheet = useCallback(() => {
    const defaults: Record<string, any> = {}
    editableColumns.forEach((col) => {
      if (col.defaultValue !== undefined) defaults[String(col.key)] = col.defaultValue
      else if (col.type === "checkbox") defaults[String(col.key)] = false
      else defaults[String(col.key)] = ""
    })
    setFormData(defaults)
    setFormError(null)
    setSheetMode("add")
    setEditingRow(null)
  }, [editableColumns])

  const openEditSheet = useCallback(
    (row: T) => {
      const values: Record<string, any> = {}
      editableColumns.forEach((col) => {
        values[String(col.key)] = row[col.key] ?? col.defaultValue ?? ""
      })
      setFormData(values)
      setFormError(null)
      setEditingRow(row)
      setSheetMode("edit")
    },
    [editableColumns]
  )

  const handleFormChange = useCallback((key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setFormError(null)
    try {
      let result: { success: boolean; error?: string }
      if (sheetMode === "add") {
        result = await onAdd(formData as Partial<T>)
      } else if (sheetMode === "edit" && editingRow && onEdit) {
        const id = editingRow.code || editingRow.id
        result = await onEdit(id, formData as Partial<T>)
      } else {
        return
      }
      if (result.success) {
        setSheetMode("closed")
      } else {
        setFormError(result.error ?? "Something went wrong")
      }
    } catch (err: any) {
      setFormError(err?.message ?? "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }, [sheetMode, onAdd, onEdit, editingRow, formData])

  const handleDelete = useCallback(
    async (row: T) => {
      const id = row.code || row.id
      const result = await onDelete(id)
      if (!result.success) {
        alert(result.error ?? "Failed to delete")
      }
    },
    [onDelete]
  )

  // Build DataGrid columns
  const gridColumns: DataGridColumn<T>[] = visibleColumns.map((col) => ({
    key: String(col.key),
    label: col.label,
    className: String(col.key) === String(columns[0]?.key) ? "font-semibold" : undefined,
    sortable: true,
    render: (row: T) => {
      const value = row[col.key]
      if (col.type === "checkbox") {
        return value ? <Check className="h-4 w-4" /> : ""
      }
      if (col.type === "color" || String(col.key) === "color") {
        const colorValue = (value as string) || ""
        return (
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: colorValue || "#ffffff" }}
            />
            <span>{colorValue}</span>
          </div>
        )
      }
      return String(value ?? "")
    },
  }))

  // Add actions column with ellipsis dropdown
  if (onEdit || onDelete) {
    gridColumns.push({
      key: "__actions",
      label: "",
      align: "right",
      render: (row: T) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => openEditSheet(row)}>
                <Edit className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && !!row.isDeletable && (
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(row)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    })
  }

  // Render form field for add/edit sheet
  const renderFormField = (col: CrudColumn<T>) => {
    const key = String(col.key)
    const value = formData[key]

    if (col.type === "checkbox") {
      return (
        <label key={key} className="flex items-center gap-3 py-2">
          <Checkbox checked={!!value} onCheckedChange={(checked) => handleFormChange(key, !!checked)} />
          <span className="text-sm font-medium">{col.label}</span>
        </label>
      )
    }

    if (col.type === "select") {
      const options = col.complexOptions || col.options?.map((opt) => ({ label: opt, value: opt })) || []
      return (
        <div key={key} className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{col.label}</label>
          <Select value={String(value ?? "")} onValueChange={(v) => handleFormChange(key, v)}>
            <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (col.type === "color") {
      return (
        <div key={key} className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{col.label}</label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="block h-8 w-8 rounded-md border" style={{ backgroundColor: String(value || "#000") }} />
              <input type="color" className="absolute inset-0 h-8 w-8 opacity-0 cursor-pointer" value={String(value || "#000")} onChange={(e) => handleFormChange(key, e.target.value)} />
            </div>
            <Input type="text" value={String(value ?? "")} onChange={(e) => handleFormChange(key, e.target.value)} placeholder="#FFFFFF" className="flex-1" />
          </div>
        </div>
      )
    }

    return (
      <div key={key} className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">{col.label}</label>
        <Input
          type={col.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={(e) => handleFormChange(key, col.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={col.label}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header — title + description + add button (matches social page) */}
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              <div className="bg-secondary text-sm px-2 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
                {items.length}
              </div>
            </div>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <Button onClick={openAddSheet}>
            <Plus className="h-4 w-4" />
            <span className="hidden md:block">Add new</span>
          </Button>
        </div>
      )}

      {/* Toolbar — search, filters, columns (matches social-list pattern) */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder || "Search..."}
            defaultValue={search}
            onKeyDown={(e) => { if (e.key === "Enter") setSearch((e.target as HTMLInputElement).value) }}
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Select table columns">
              <Columns3 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={String(col.key)}
                checked={!hiddenColumns.has(String(col.key))}
                onCheckedChange={() => toggleColumn(String(col.key))}
                disabled={String(col.key) === String(columns[0]?.key)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-auto max-h-[96vh] w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {filterableColumns.length > 0 ? (
              filterableColumns.map((col) => {
                const key = String(col.key)
                const options = col.complexOptions || col.options?.map((opt) => ({ label: opt, value: opt })) || []
                return (
                  <div key={key} className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{col.label}</label>
                    <Select value={filters[key] || "-"} onValueChange={(v) => setFilters((prev) => ({ ...prev, [key]: v }))}>
                      <SelectTrigger className="w-full h-10"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-">All</SelectItem>
                        {options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No filters available for this view.</p>
            )}
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>Apply</Button>
              <Button variant="outline" className="flex-1" onClick={() => { clearAll(); setFilterSheetOpen(false) }}>Clear all</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Data grid */}
      <DataGrid
        data={filtered}
        columns={gridColumns}
        emptyTitle="No items"
        emptyDescription="Get started by adding your first item."
      />

      {/* Add/Edit sheet */}
      <Sheet open={sheetMode !== "closed"} onOpenChange={(open) => !open && setSheetMode("closed")}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-auto max-h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>{sheetMode === "add" ? "Add new" : "Edit"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {editableColumns.map(renderFormField)}
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setSheetMode("closed")} className="flex-1">
                Cancel
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

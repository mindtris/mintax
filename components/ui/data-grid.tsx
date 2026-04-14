"use client"

import * as React from "react"
import { useState, useMemo, useCallback } from "react"
import { ArrowDownIcon, ArrowUpIcon, Edit, EllipsisVertical, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Column Definition ───────────────────────────────────────────────────────

export interface DataGridColumn<T> {
  /** Unique key matching a field on T */
  key: string
  /** Display label in header */
  label: string
  /** Optional className applied to header & cells */
  className?: string
  /** Column is sortable */
  sortable?: boolean
  /** Text alignment shortcut */
  align?: "left" | "center" | "right"
  /** Custom cell renderer — if omitted, renders `String(row[key])` */
  render?: (row: T, index: number) => React.ReactNode
  /** Footer aggregate renderer */
  footer?: (rows: T[]) => React.ReactNode
  /** For sheet‐based editing: input type */
  editType?: "text" | "number" | "checkbox" | "select" | "color" | "hidden"
  /** Select options when editType is "select" */
  editOptions?: { label: string; value: string }[]
  /** Whether this field is editable in the sheet form */
  editable?: boolean
  /** Default value for new items */
  defaultValue?: string | number | boolean
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

export interface SortState {
  field: string | null
  direction: "asc" | "desc" | null
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DataGridProps<T extends Record<string, any>> {
  /** Data rows */
  data: T[]
  /** Column definitions */
  columns: DataGridColumn<T>[]
  /** Unique key extractor — defaults to `row.id` */
  getRowId?: (row: T) => string

  // ── Selection ──
  /** Enable row selection checkboxes */
  selectable?: boolean
  /** Controlled selected IDs */
  selectedIds?: string[]
  /** Selection change callback */
  onSelectionChange?: (ids: string[]) => void

  // ── Sorting ──
  /** Controlled sort state */
  sort?: SortState
  /** Sort change callback — if omitted, sorting is handled internally */
  onSortChange?: (sort: SortState) => void

  // ── Row interaction ──
  /** Row click handler — if renderDetailSheet is set, this is ignored */
  onRowClick?: (row: T) => void
  /** Highlight predicate for rows */
  rowHighlight?: (row: T) => boolean
  /** Render custom content inside a Sheet when a row is clicked */
  renderDetailSheet?: (row: T, onClose: () => void) => React.ReactNode

  // ── CRUD via Sheet ──
  /** Enable add button + sheet form */
  onAdd?: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  /** Enable edit button per row + sheet form */
  onEdit?: (id: string, data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  /** Enable delete button per row */
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>
  /** Whether an individual row is deletable — defaults to true for all */
  isRowDeletable?: (row: T) => boolean

  // ── Empty state ──
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyActions?: React.ReactNode

  // ── Footer slot (rendered below table inside the border) ──
  footer?: React.ReactNode

  // ── Wrapper className ──
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  getRowId = (row) => row.id ?? row.code ?? String(Math.random()),
  selectable = false,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  sort: controlledSort,
  onSortChange,
  onRowClick,
  rowHighlight,
  renderDetailSheet,
  onAdd,
  onEdit,
  onDelete,
  isRowDeletable = () => true,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActions,
  footer,
  className,
}: DataGridProps<T>) {
  // ── Internal selection state (uncontrolled fallback) ──
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([])
  const selectedIds = controlledSelectedIds ?? internalSelectedIds
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds

  // ── Internal sort state (uncontrolled fallback) ──
  const [internalSort, setInternalSort] = useState<SortState>({ field: null, direction: null })
  const sort = controlledSort ?? internalSort
  const setSort = onSortChange ?? setInternalSort

  // ── Sheet state for CRUD ──
  const [sheetMode, setSheetMode] = useState<"closed" | "add" | "edit">("closed")
  const [editingRow, setEditingRow] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ── Detail sheet state ──
  const [detailRow, setDetailRow] = useState<T | null>(null)

  const hasActions = !!(onEdit || onDelete)
  const hasFooter = columns.some((col) => col.footer)

  // ── Column alignment helper ──
  const alignClass = (col: DataGridColumn<T>) =>
    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"

  // ── Sorting ──
  const handleSort = useCallback(
    (field: string) => {
      let newDirection: "asc" | "desc" | null = "asc"
      if (sort.field === field) {
        if (sort.direction === "asc") newDirection = "desc"
        else if (sort.direction === "desc") newDirection = null
      }
      setSort({ field: newDirection ? field : null, direction: newDirection })
    },
    [sort, setSort]
  )

  const getSortIcon = (field: string) => {
    if (sort.field !== field) return null
    return sort.direction === "asc" ? (
      <ArrowUpIcon className="w-4 h-4 ml-1 inline" />
    ) : sort.direction === "desc" ? (
      <ArrowDownIcon className="w-4 h-4 ml-1 inline" />
    ) : null
  }

  // ── Selection ──
  const toggleAll = useCallback(() => {
    if (selectedIds.length === data.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.map(getRowId))
    }
  }, [selectedIds, data, getRowId, setSelectedIds])

  const toggleOne = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((i) => i !== id))
      } else {
        setSelectedIds([...selectedIds, id])
      }
    },
    [selectedIds, setSelectedIds]
  )

  // ── Sheet CRUD helpers ──
  const editableColumns = useMemo(
    () => columns.filter((col) => col.editable),
    [columns]
  )

  const openAddSheet = useCallback(() => {
    const defaults: Record<string, any> = {}
    editableColumns.forEach((col) => {
      if (col.defaultValue !== undefined) defaults[col.key] = col.defaultValue
      else if (col.editType === "checkbox") defaults[col.key] = false
      else defaults[col.key] = ""
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
        values[col.key] = row[col.key] ?? col.defaultValue ?? ""
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
      if (sheetMode === "add" && onAdd) {
        result = await onAdd(formData as Partial<T>)
      } else if (sheetMode === "edit" && onEdit && editingRow) {
        const id = getRowId(editingRow)
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
  }, [sheetMode, onAdd, onEdit, editingRow, formData, getRowId])

  const handleDelete = useCallback(
    async (row: T) => {
      if (!onDelete) return
      const id = getRowId(row)
      const result = await onDelete(id)
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete")
      }
    },
    [onDelete, getRowId]
  )

  // ── Render form field inside Sheet ──
  const renderFormField = (col: DataGridColumn<T>) => {
    const value = formData[col.key]

    if (col.editType === "hidden") return null

    if (col.editType === "checkbox") {
      return (
        <label key={col.key} className="flex items-center gap-3 py-2">
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => handleFormChange(col.key, !!checked)}
          />
          <span className="text-sm font-medium">{col.label}</span>
        </label>
      )
    }

    if (col.editType === "select") {
      return (
        <div key={col.key} className="space-y-2">
          <label className="text-sm font-medium">{col.label}</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={String(value ?? "")}
            onChange={(e) => handleFormChange(col.key, e.target.value)}
          >
            {col.editOptions?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (col.editType === "color") {
      return (
        <div key={col.key} className="space-y-2">
          <label className="text-sm font-medium">{col.label}</label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className="block h-8 w-8 rounded-md border"
                style={{ backgroundColor: String(value || "#000") }}
              />
              <input
                type="color"
                className="absolute inset-0 h-8 w-8 opacity-0 cursor-pointer"
                value={String(value || "#000")}
                onChange={(e) => handleFormChange(col.key, e.target.value)}
              />
            </div>
            <Input
              type="text"
              value={String(value ?? "")}
              onChange={(e) => handleFormChange(col.key, e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1"
            />
          </div>
        </div>
      )
    }

    // Default: text / number
    return (
      <div key={col.key} className="space-y-2">
        <label className="text-sm font-medium">{col.label}</label>
        <Input
          type={col.editType === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={(e) =>
            handleFormChange(
              col.key,
              col.editType === "number" ? Number(e.target.value) : e.target.value
            )
          }
          placeholder={col.label}
        />
      </div>
    )
  }

  // ── Empty state ──
  if (data.length === 0 && (emptyTitle || emptyDescription || emptyActions)) {
    return (
      <div className={cn("rounded-md border", className)}>
        <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
          {emptyIcon && <div className="text-muted-foreground">{emptyIcon}</div>}
          {emptyTitle && <h3 className="text-sm font-semibold">{emptyTitle}</h3>}
          {emptyDescription && (
            <p className="text-muted-foreground text-xs text-center max-w-md">{emptyDescription}</p>
          )}
          {emptyActions && <div className="flex gap-3 mt-2">{emptyActions}</div>}
        </div>
        {renderSheet()}
      </div>
    )
  }

  // ── Sheet render ──
  function renderSheet() {
    return (
      <Sheet
        open={sheetMode !== "closed"}
        onOpenChange={(open) => !open && setSheetMode("closed")}
      >
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
            <SheetTitle>{sheetMode === "add" ? "Add new" : "Edit"}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {editableColumns.map(renderFormField)}

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <SheetFooter className="px-6 py-4 shrink-0">
            <div className="flex gap-2 w-full">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSheetMode("closed")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // ── Main render ──
  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    alignClass(col),
                    col.className,
                    col.sortable && "hover:cursor-pointer hover:bg-accent select-none"
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && getSortIcon(col.key)}
                </TableHead>
              ))}
              {hasActions && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No data.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId(row)
                const isSelected = selectedIds.includes(rowId)
                const isHighlighted = rowHighlight?.(row) ?? false

                return (
                  <TableRow
                    key={rowId}
                    className={cn(
                      (onRowClick || renderDetailSheet) && "cursor-pointer",
                      isSelected && "bg-muted",
                      isHighlighted && "bg-muted",
                      "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      if (renderDetailSheet) {
                        setDetailRow(row)
                      } else {
                        onRowClick?.(row)
                      }
                    }}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(rowId)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn(alignClass(col), col.className)}>
                        {col.render
                          ? col.render(row, index)
                          : String(row[col.key] ?? "")}
                      </TableCell>
                    ))}
                    {hasActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                            {onDelete && isRowDeletable(row) && (
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(row)}>
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>

          {hasFooter && (
            <TableFooter>
              <TableRow>
                {selectable && <TableCell />}
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn(alignClass(col), col.className)}>
                    {col.footer ? col.footer(data) : ""}
                  </TableCell>
                ))}
                {hasActions && <TableCell />}
              </TableRow>
            </TableFooter>
          )}
        </Table>

        {footer}
      </div>

      {renderSheet()}

      {/* Detail Sheet — custom content when a row is clicked */}
      {renderDetailSheet && (
        <Sheet
          open={detailRow !== null}
          onOpenChange={(open) => !open && setDetailRow(null)}
        >
          <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-lg flex flex-col gap-0 p-0">
            <div className="flex flex-col h-full overflow-hidden">
              {detailRow && renderDetailSheet(detailRow, () => setDetailRow(null))}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

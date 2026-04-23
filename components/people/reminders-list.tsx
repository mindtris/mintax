"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid } from "@/components/ui/data-grid"
import { Input } from "@/components/ui/input"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CATEGORY_LABELS, PRIORITY_LABELS, REMINDER_CATEGORIES, REMINDER_PRIORITIES } from "@/lib/schemas/reminders"
import { cn } from "@/lib/utils"
import { format, isPast } from "date-fns"
import { BellPlus, Calendar, Check, ColumnsIcon, Filter, MoreVertical, Search, Trash2, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { completeReminderAction, deleteReminderAction } from "@/app/(app)/apps/reminders/actions"
import { ReminderForm } from "@/app/(app)/apps/reminders/components/reminder-form"
import { RemindersBulkActions } from "./reminders-bulk-actions"

// Using standard Badge variants for priorities:
// urgent -> destructive
// high -> default (Primary)
// medium -> secondary
// low -> outline
const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  completed: "default",
  snoozed: "outline",
  cancelled: "outline",
}

type ColumnKey = "title" | "category" | "priority" | "dueAt" | "status" | "actions"

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "priority", label: "Priority" },
  { key: "dueAt", label: "Due date" },
  { key: "status", label: "Status" },
]

type Props = {
  reminders: any[]
  members: any[]
  categories: any[]
  currentUserId: string
  createOpen: boolean
  setCreateOpen: (open: boolean) => void
}

export function RemindersList({ reminders, members, categories, currentUserId, createOpen, setCreateOpen }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("-")
  const [categoryFilter, setCategoryFilter] = useState("-")
  const [priorityFilter, setPriorityFilter] = useState("-")
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(["title", "category", "priority", "dueAt", "status", "actions"])
  const [editingReminder, setEditingReminder] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filtered = useMemo(() => {
    let result = reminders
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((r: any) => r.title.toLowerCase().includes(q))
    }
    if (statusFilter && statusFilter !== "-") {
      result = result.filter((r: any) => r.status === statusFilter)
    }
    if (categoryFilter && categoryFilter !== "-") {
      result = result.filter((r: any) => r.category === categoryFilter)
    }
    if (priorityFilter && priorityFilter !== "-") {
      result = result.filter((r: any) => r.priority === priorityFilter)
    }
    return result
  }, [reminders, search, statusFilter, categoryFilter, priorityFilter])

  const allColumns = useMemo(() => [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row: any) => {
        const isOverdue = isPast(new Date(row.dueAt)) && row.status === "pending"
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 border bg-primary/5 border-primary/10">
              <BellPlus className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className={cn("font-semibold text-foreground", row.status === "completed" && "line-through opacity-60")}>
                {row.title}
              </span>
              {row.description && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[300px]">{row.description}</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: "category",
      label: "Category",
      render: (row: any) => {
        const dynamicCategory = categories?.find(c => (c.code || c.id) === row.category);
        return (
          <Badge variant="secondary" className="text-[10px] font-medium border-border/50">
            {dynamicCategory ? dynamicCategory.name : (CATEGORY_LABELS[row.category] || row.category)}
          </Badge>
        );
      },
    },
    {
      key: "priority",
      label: "Priority",
      render: (row: any) => (
        <Badge variant={PRIORITY_VARIANTS[row.priority] || "outline"} className="text-[10px] capitalize">
          {PRIORITY_LABELS[row.priority] || row.priority}
        </Badge>
      ),
    },
    {
      key: "dueAt",
      label: "Due date",
      sortable: true,
      render: (row: any) => {
        const isOverdue = isPast(new Date(row.dueAt)) && row.status === "pending"
        return (
          <div className="flex items-center gap-2">
            <Calendar className={cn("h-3.5 w-3.5", isOverdue ? "text-destructive" : "text-muted-foreground")} />
            <span className={cn("text-sm", isOverdue && "text-destructive font-medium")}>
              {format(new Date(row.dueAt), "MMM d, yyyy")}
            </span>
          </div>
        )
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        const isOverdue = isPast(new Date(row.dueAt)) && row.status === "pending"
        return (
          <Badge variant={isOverdue ? "destructive" : (STATUS_VARIANTS[row.status] || "outline")} className="text-[10px] capitalize">
            {isOverdue ? "overdue" : row.status}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      label: "",
      className: "w-[40px]",
      render: (row: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent transition-colors">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={async () => {
                  if (confirm("Delete this reminder?")) {
                    await deleteReminderAction(row.id)
                    router.refresh()
                  }
                }}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [])

  const dynamicColumns = useMemo(() => {
    return allColumns.filter((col) => visibleColumns.includes(col.key as ColumnKey))
  }, [visibleColumns, allColumns])

  const isFiltered = search || (statusFilter !== "-") || (categoryFilter !== "-") || (priorityFilter !== "-")
  const activeFilterCount = [
    statusFilter !== "-",
    categoryFilter !== "-",
    priorityFilter !== "-",
  ].filter(Boolean).length

  const toggleColumn = (key: ColumnKey) => {
    if (key === "title" || key === "actions") return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  const clearAll = () => {
    setSearch("")
    setStatusFilter("-")
    setCategoryFilter("-")
    setPriorityFilter("-")
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reminders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 bg-background/50"
          />
        </div>

        <Button
          variant={activeFilterCount > 0 ? "default" : "outline"}
          onClick={() => setFilterSheetOpen(true)}
          className="px-4 text-xs h-10"
        >
          <Filter className="h-3.5 w-3.5 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {isFiltered && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground h-10 w-10"
            title="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Select table columns" className="h-10 w-10">
              <ColumnsIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {ALL_COLUMNS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visibleColumns.includes(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
                disabled={col.key === "title"}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 shadow-2xl overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="snoozed">Snoozed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All categories</SelectItem>
                  {REMINDER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All priorities</SelectItem>
                  {REMINDER_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
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

      <DataGrid
        data={filtered}
        columns={dynamicColumns}
        getRowId={(row: any) => row.id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row: any) => setEditingReminder(row)}
        renderDetailSheet={(row: any, onClose: () => void) => (
          <div className="flex flex-col h-full gap-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-semibold leading-none">Edit reminder</SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ReminderForm
                initialData={row}
                onSuccess={() => {
                  router.refresh();
                  onClose()
                }}
                currentUserId={currentUserId}
                members={members}
                categories={categories}
              />
            </div>
          </div>
        )}
        emptyIcon={
          <Image src="/empty-state.svg" alt="No reminders" width={120} height={120} priority />
        }
        emptyTitle="Reminders"
        emptyDescription="No reminders found. Create one to stay on top of deadlines."
      />

      {selectedIds.length > 0 && (
        <RemindersBulkActions
          selectedIds={selectedIds}
          onActionComplete={() => setSelectedIds([])}
        />
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side="right"
          className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0 shadow-2xl overflow-hidden"
        >
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>New reminder</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ReminderForm
              onSuccess={() => { setCreateOpen(false); router.refresh() }}
              currentUserId={currentUserId}
              members={members}
              categories={categories}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

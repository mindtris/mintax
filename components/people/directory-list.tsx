"use client"

import { DataGrid } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnsIcon, Filter, Search, X } from "lucide-react"
import { useMemo, useState } from "react"

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  accountant: "secondary",
  member: "outline",
  viewer: "outline",
}

type MemberRow = {
  id: string
  name: string
  email: string
  role: string
  initial: string
}

type ColumnKey = "name" | "role"

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
]

export function DirectoryList({ members }: { members: MemberRow[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("-")
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(["name", "role"])

  const filtered = useMemo(() => {
    let result = members
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      )
    }
    if (roleFilter && roleFilter !== "-") {
      result = result.filter((m) => m.role === roleFilter)
    }
    return result
  }, [members, search, roleFilter])

  const allColumns = useMemo(() => [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: MemberRow) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-8 w-8 rounded-full bg-[#c96442]/10 flex items-center justify-center text-xs font-bold text-[#c96442] shrink-0">
            {row.initial}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.name}</span>
            <span className="text-[11px] text-muted-foreground">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (row: MemberRow) => (
        <Badge variant={roleBadgeVariant[row.role] || "outline"} className="text-[10px] capitalize">
          {row.role}
        </Badge>
      ),
    },
  ], [])

  const dynamicColumns = useMemo(() => {
    return allColumns.filter((col) => visibleColumns.includes(col.key as ColumnKey))
  }, [visibleColumns, allColumns])

  const isFiltered = search || (roleFilter && roleFilter !== "-")
  const activeFilterCount = [roleFilter && roleFilter !== "-"].filter(Boolean).length

  const toggleColumn = (key: ColumnKey) => {
    if (key === "name") return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch((e.target as HTMLInputElement).value)
              }
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
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {isFiltered && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearch("")
              setRoleFilter("-")
            }}
            className="text-muted-foreground hover:text-foreground"
            title="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Select table columns">
              <ColumnsIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {ALL_COLUMNS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visibleColumns.includes(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
                disabled={col.key === "name"}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>
                Apply
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRoleFilter("-")
                  setFilterSheetOpen(false)
                }}
              >
                Clear all
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DataGrid
        data={filtered}
        columns={dynamicColumns}
        emptyTitle="Directory"
        emptyDescription="No team members yet. Invite your first member to get started."
      />
    </div>
  )
}

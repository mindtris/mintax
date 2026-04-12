"use client"

import { DataGrid } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { 
  ColumnsIcon, 
  Filter, 
  Search, 
  X, 
  UserRoundCog, 
  Trash2, 
  MoreVertical,
  Mail,
  ShieldAlert,
  UserX,
  UserPlus
} from "lucide-react"
import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { DirectoryBulkActions } from "./directory-bulk-actions"
import { updateMemberRoleAction, removeMemberAction } from "@/app/(app)/people/actions"
import { InviteMemberSheet } from "./invite-member-sheet"
import { ORGANIZATION_ROLES } from "@/lib/constants/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

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

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      setIsUpdating(true)
      const res = await updateMemberRoleAction(userId, newRole)
      if (res.success) {
        toast.success("Member role updated")
      } else {
        toast.error(res.error || "Failed to update role")
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return
    try {
      setIsUpdating(true)
      const res = await removeMemberAction(userId)
      if (res.success) {
        toast.success("Member removed from organization")
      } else {
        toast.error(res.error || "Failed to remove member")
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const allColumns = useMemo(() => [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: MemberRow) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/20">
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
        <Badge variant={roleBadgeVariant[row.role] || "outline"} className="text-[10px] capitalize font-medium">
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
            placeholder="Search team..."
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
            onClick={() => {
              setSearch("")
              setRoleFilter("-")
            }}
            className="text-muted-foreground hover:text-foreground h-10 w-10"
            title="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Select columns" className="h-10 w-10">
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
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 shadow-2xl overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">User role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All roles</SelectItem>
                  {ORGANIZATION_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>
                Apply filters
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRoleFilter("-")
                  setFilterSheetOpen(false)
                }}
              >
                Reset
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DataGrid
        data={filtered}
        columns={dynamicColumns}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        renderDetailSheet={(member, onClose) => (
          <div className="flex flex-col h-full gap-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0 border-2 border-primary/20">
                  {member.initial}
                </div>
                <div className="flex flex-col">
                  <SheetTitle className="text-xl leading-none mb-1">{member.name}</SheetTitle>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{member.email}</span>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserRoundCog className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">Security and access</Label>
                </div>
                <div className="bg-muted/40 rounded-xl p-5 border border-border/50">
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">Organization role</Label>
                    <Select defaultValue={member.role} onValueChange={(val) => handleRoleUpdate(member.id, val)} disabled={isUpdating}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        {ORGANIZATION_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Roles determine what actions this user can perform. Administrators can manage settings and billing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <Label className="text-sm font-semibold text-destructive">Danger zone</Label>
                </div>
                <div className="bg-destructive/5 rounded-xl p-5 border border-destructive/10">
                  <h4 className="text-sm font-semibold text-destructive mb-1">Remove from organization</h4>
                  <p className="text-xs text-destructive/80 mb-4 leading-relaxed">
                    Once removed, this user will lose all access to this organization and its data immediately.
                  </p>
                  <Button variant="destructive" size="sm" className="w-full gap-2" disabled={isUpdating} onClick={() => { handleRemoveMember(member.id); onClose() }}>
                    <UserX className="h-4 w-4" />
                    Remove member
                  </Button>
                </div>
              </div>
            </div>

            <SheetFooter className="px-6 py-4 border-t shrink-0">
              <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
            </SheetFooter>
          </div>
        )}
        emptyIcon={
          <Image src="/empty-state.svg" alt="No members" width={120} height={120} priority />
        }
        emptyTitle="Team Directory"
        emptyDescription="Your organization library is currently empty. Invite team members to collaborate."
        emptyActions={
          <InviteMemberSheet />
        }
      />

      {selectedIds.length > 0 && (
        <DirectoryBulkActions selectedIds={selectedIds} onActionComplete={() => setSelectedIds([])} />
      )}
    </div>
  )
}

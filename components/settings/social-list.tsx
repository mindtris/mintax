"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid } from "@/components/ui/data-grid"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColumnsIcon, Facebook, Filter, Instagram, Linkedin, MoreVertical, Power, Search, Share2, Trash2, Twitter, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { disableSocialAccountAction, deleteSocialAccountAction } from "@/app/(app)/settings/social/actions"

const providerIcons: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
}

const providerColors: Record<string, string> = {
  facebook: "bg-blue-500/10 text-blue-600",
  twitter: "bg-sky-500/10 text-sky-600",
  linkedin: "bg-blue-700/10 text-blue-700",
  instagram: "bg-pink-500/10 text-pink-600",
}

type AccountRow = {
  id: string
  name: string
  provider: string
  username: string | null
  disabled: boolean
}

type ColumnKey = "name" | "provider" | "status" | "actions"

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Account" },
  { key: "provider", label: "Platform" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
]

export function SocialAccountsList({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [providerFilter, setProviderFilter] = useState("-")
  const [statusFilter, setStatusFilter] = useState("-")
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(["name", "provider", "status", "actions"])

  const filtered = useMemo(() => {
    let result = accounts
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((a) => a.name.toLowerCase().includes(q) || a.provider.toLowerCase().includes(q))
    }
    if (providerFilter && providerFilter !== "-") {
      result = result.filter((a) => a.provider === providerFilter)
    }
    if (statusFilter && statusFilter !== "-") {
      result = result.filter((a) => (statusFilter === "active" ? !a.disabled : a.disabled))
    }
    return result
  }, [accounts, search, providerFilter, statusFilter])

  const isFiltered = search || providerFilter !== "-" || statusFilter !== "-"
  const activeFilterCount = [providerFilter !== "-", statusFilter !== "-"].filter(Boolean).length

  const toggleColumn = (key: ColumnKey) => {
    if (key === "name") return
    setVisibleColumns((prev) => prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key])
  }

  const clearAll = () => { setSearch(""); setProviderFilter("-"); setStatusFilter("-") }

  const columns = useMemo(() => [
    {
      key: "name",
      label: "Account",
      render: (row: AccountRow) => {
        const Icon = providerIcons[row.provider] || Share2
        const color = providerColors[row.provider] || "bg-muted text-muted-foreground"
        return (
          <div className="flex items-center gap-3 py-1">
            <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{row.name}</span>
              <span className="text-[11px] text-muted-foreground capitalize">
                {row.provider}{row.username ? ` · @${row.username}` : ""}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: "provider",
      label: "Platform",
      render: (row: AccountRow) => (
        <Badge variant="outline" className="text-[10px] font-medium capitalize border-black/[0.08] bg-black/[0.02]">
          {row.provider}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: AccountRow) => (
        <Badge variant={row.disabled ? "outline" : "default"} className="text-[10px]">
          {row.disabled ? "Disabled" : "Active"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right" as const,
      render: (row: AccountRow) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={async () => { await disableSocialAccountAction(row.id, !row.disabled); router.refresh() }}>
              <Power className="h-4 w-4" />
              {row.disabled ? "Enable" : "Disable"}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={async () => { if (confirm("Delete this account?")) { await deleteSocialAccountAction(row.id); router.refresh() } }}>
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [router])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
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

      {/* Filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Platform</label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All platforms</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
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
        columns={columns.filter((c) => visibleColumns.includes(c.key as ColumnKey))}
        emptyIcon={<Image src="/empty-state.svg" alt="No accounts" width={120} height={120} priority />}
        emptyTitle="Social accounts"
        emptyDescription="No social accounts connected yet."
      />
    </div>
  )
}

"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Globe, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

const typeStyles: Record<string, string> = {
  client: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  vendor: "bg-green-500/10 text-green-600 border-green-500/20",
  partner: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  contractor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
}

export type ContactRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: string
  country: string | null
  city: string | null
  avatar: string | null
  isActive: boolean
  reference: string | null
  _count: { invoices: number; transactions: number }
}

export function ContactsGrid({ contacts, activeTab }: { contacts: ContactRow[], activeTab: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [sorting, setSorting] = useState<SortState>(() => {
    const ordering = searchParams.get("ordering")
    if (!ordering) return { field: null, direction: null }
    const isDesc = ordering.startsWith("-")
    return {
      field: isDesc ? ordering.slice(1) : ordering,
      direction: isDesc ? "desc" : "asc",
    }
  })

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (sorting.field && sorting.direction) {
      const ordering = sorting.direction === "desc" ? `-${sorting.field}` : sorting.field
      params.set("ordering", ordering)
    } else {
      params.delete("ordering")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [sorting])

  const columns: DataGridColumn<ContactRow>[] = useMemo(() => [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-8 w-8 border border-black/[0.05]">
            {row.avatar && <AvatarImage src={row.avatar} alt={row.name} />}
            <AvatarFallback className="text-[10px] font-bold bg-[#c96442]/10 text-[#c96442]">
              {row.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground truncate">{row.name}</span>
            {row.reference && (
              <span className="text-[11px] text-muted-foreground truncate">{row.reference}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className={cn("text-[10px] font-medium capitalize", typeStyles[row.type] || "bg-muted text-muted-foreground")}>
          {row.type}
        </Badge>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.email ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{row.email}</span>
            </div>
          ) : (
            <span className="text-xs italic text-muted-foreground">No email</span>
          )}
          {row.phone && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span className="tabular-nums">{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "country",
      label: "Location",
      sortable: true,
      render: (row) => {
        const loc = [row.city, row.country].filter(Boolean).join(", ")
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span className="truncate">{loc || "—"}</span>
          </div>
        )
      },
    },
    {
      key: "financials",
      label: "Activity",
      align: "right",
      render: (row) => (
        <div className="flex flex-col items-end gap-0.5 pr-2">
          <span className="text-xs tabular-nums">{row._count.invoices} invoices</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">{row._count.transactions} txns</span>
        </div>
      ),
    },
  ], [])

  return (
    <DataGrid
      data={contacts}
      columns={columns}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      sort={sorting}
      onSortChange={setSorting}
      onRowClick={(row) => router.push(`/customers/${row.id}`)}
      emptyIcon={
        <Image src="/empty-state.svg" alt="No contacts" width={120} height={120} priority />
      }
      emptyTitle="Contacts"
      emptyDescription="No contacts yet. Add your first contact to start tracking relationships."
    />
  )
}

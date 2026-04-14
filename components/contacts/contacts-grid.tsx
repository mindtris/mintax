"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { EllipsisVertical, Edit, Trash2, Globe, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteContactAction } from "@/app/(app)/customers/actions"
import { toast } from "sonner"
import { EditContactSheet } from "./edit-contact-sheet"

const typeStyles: Record<string, string> = {
  client: "bg-primary/10 text-primary border-primary/20",
  vendor: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  partner: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  contractor: "bg-chart-5/10 text-chart-5 border-chart-5/20",
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

export function ContactsGrid({ contacts, activeTab, currencies = [] }: { contacts: ContactRow[], activeTab: string, currencies?: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

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
          <Avatar className="h-8 w-8 border border-border">
            {row.avatar && <AvatarImage src={row.avatar} alt={row.name} />}
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
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
            <span className={cn("truncate", !loc && "text-muted-foreground/50 italic text-[11px]")}>
              {loc || "Not available"}
            </span>
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
    {
      key: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditClick(row)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this contact?")) {
                    const res = await deleteContactAction(row.id)
                    if (res?.error) toast.error(res.error)
                    else toast.success("Contact deleted")
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [router, searchParams])

  const handleEditClick = (row: ContactRow) => {
    setSelectedContactId(row.id)
    setIsEditSheetOpen(true)
  }

  return (
    <>
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

      <EditContactSheet 
        contactId={selectedContactId}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        currencies={currencies}
      />
    </>
  )
}

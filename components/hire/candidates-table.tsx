"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FileText, Phone } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Image from "next/image"

export type CandidateRow = {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  source?: string
  jobTitle?: string
  createdAt: string | Date
}

const statusStyles: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  screening: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  interviewing: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  offered: "bg-green-500/10 text-green-600 border-green-500/20",
  hired: "bg-green-600 text-white border-green-600",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
}

export function CandidatesTable({ candidates, tab, visibleColumns }: { candidates: CandidateRow[]; tab?: string; visibleColumns?: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [sorting, setSorting] = useState<SortState>(() => {
    const ordering = searchParams.get("ordering")
    if (!ordering) return { field: null, direction: null }
    const isDesc = ordering.startsWith("-")
    return { field: isDesc ? ordering.slice(1) : ordering, direction: isDesc ? "desc" : "asc" }
  })

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (sorting.field && sorting.direction) {
      params.set("ordering", sorting.direction === "desc" ? `-${sorting.field}` : sorting.field)
    } else {
      params.delete("ordering")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [sorting])

  const columns: DataGridColumn<CandidateRow>[] = useMemo(() => [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
              {row.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground truncate">{row.name}</span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Stage",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className={cn("text-[10px] font-medium capitalize", statusStyles[row.status] || "bg-muted text-muted-foreground")}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "jobTitle",
      label: tab === "bench" ? "Skill" : "Position",
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span className="truncate">{row.jobTitle || (tab === "bench" ? "General" : "Direct")}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => row.phone ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span className="tabular-nums">{row.phone}</span>
        </div>
      ) : null,
    },
    {
      key: "createdAt",
      label: tab === "bench" ? "Added" : "Applied",
      sortable: true,
      render: (row) => (
        <span className="text-sm tabular-nums">
          {format(new Date(row.createdAt), "MMM dd, yyyy")}
        </span>
      ),
    },
  ], [tab])

  const filteredColumns = visibleColumns
    ? columns.filter((col) => visibleColumns.includes(col.key))
    : columns

  return (
    <DataGrid
      data={candidates}
      columns={filteredColumns}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      sort={sorting}
      onSortChange={setSorting}
      onRowClick={(row) => router.push(`/hire/candidates/${row.id}`)}
      emptyIcon={<Image src="/empty-state.svg" alt="No candidates" width={120} height={120} priority />}
      emptyTitle={tab === "bench" ? "Bench" : "Candidates"}
      emptyDescription={tab === "bench"
        ? "No bench resources yet. Add personnel to start tracking."
        : "No candidates yet. They will appear here once they apply."
      }
    />
  )
}

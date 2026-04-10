"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Image from "next/image"

export type JobRow = {
  id: string
  title: string
  status: string
  type: string
  currency: string
  salaryMin?: number
  salaryMax?: number
  createdAt: string | Date
  _count: { candidates: number }
  category?: { name: string; color: string }
}

const statusStyles: Record<string, string> = {
  open: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-muted text-muted-foreground border-border",
  draft: "bg-orange-500/10 text-orange-600 border-orange-500/20",
}

export function JobsTable({ jobs, visibleColumns }: { jobs: JobRow[]; visibleColumns?: string[] }) {
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

  const columns: DataGridColumn<JobRow>[] = useMemo(() => [
    {
      key: "title",
      label: "Position",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground truncate">{row.title}</span>
            <div className="flex items-center gap-1.5">
              {row.category && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.category.color }} />
                  {row.category.name}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground capitalize">{row.type}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className={cn("text-[10px] font-medium capitalize", statusStyles[row.status] || statusStyles.draft)}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "candidates",
      label: "Applicants",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5 text-sm">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="tabular-nums">{row._count.candidates}</span>
        </div>
      ),
    },
    {
      key: "salary",
      label: "Budget",
      render: (row) => (
        <div className="text-sm font-mono text-right pr-4">
          {row.salaryMin ? (
            <span>{(row.salaryMin / 1000).toFixed(0)}k — {(row.salaryMax! / 1000).toFixed(0)}k {row.currency}</span>
          ) : (
            <span className="text-muted-foreground italic text-xs">Confidential</span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Posted",
      sortable: true,
      render: (row) => (
        <span className="text-sm tabular-nums">
          {format(new Date(row.createdAt), "MMM dd, yyyy")}
        </span>
      ),
    },
  ], [])

  const filteredColumns = visibleColumns
    ? columns.filter((col) => visibleColumns.includes(col.key))
    : columns

  return (
    <DataGrid
      data={jobs}
      columns={filteredColumns}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      sort={sorting}
      onSortChange={setSorting}
      onRowClick={(row) => router.push(`/hire/${row.id}`)}
      emptyIcon={<Image src="/empty-state.svg" alt="No jobs" width={120} height={120} priority />}
      emptyTitle="Jobs"
      emptyDescription="No job postings yet. Create your first one to start hiring."
    />
  )
}

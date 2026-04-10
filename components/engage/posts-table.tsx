"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Share2, Facebook, Twitter, Linkedin, Instagram, Play, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export type PostRow = {
  id: string
  title: string
  content: string
  status: string
  scheduledAt?: string | Date | null
  publishedAt?: string | Date | null
  socialAccount: { provider: string }
}

const statusStyles: Record<string, string> = {
  published: "bg-green-500/10 text-green-600 border-green-500/20",
  queued: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  draft: "bg-muted text-muted-foreground border-border",
  error: "bg-red-500/10 text-red-600 border-red-500/20",
}

const providerIcons: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Play,
}

export function PostsTable({ posts, visibleColumns }: { posts: PostRow[]; visibleColumns?: string[] }) {
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

  const columns: DataGridColumn<PostRow>[] = useMemo(() => [
    {
      key: "content",
      label: "Post",
      sortable: true,
      render: (row) => {
        const ProviderIcon = providerIcons[row.socialAccount.provider.toLowerCase()] || Share2
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
              <ProviderIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground truncate max-w-[280px]">{row.title || row.content.slice(0, 50)}</span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[280px] capitalize">
                {row.socialAccount.provider}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className={cn("text-[10px] font-medium capitalize", statusStyles[row.status] || "bg-muted text-muted-foreground")}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "scheduledAt",
      label: "Date",
      sortable: true,
      render: (row) => {
        const date = row.publishedAt || row.scheduledAt || null
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="tabular-nums">
              {date ? format(new Date(date), "MMM dd, yyyy · HH:mm") : "Unscheduled"}
            </span>
          </div>
        )
      },
    },
  ], [])

  const filteredColumns = visibleColumns
    ? columns.filter((col) => visibleColumns.includes(col.key))
    : columns

  return (
    <DataGrid
      data={posts}
      columns={filteredColumns}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      sort={sorting}
      onSortChange={setSorting}
      onRowClick={(row) => router.push(`/engage/posts/${row.id}`)}
      emptyIcon={<Image src="/empty-state.svg" alt="No posts" width={120} height={120} priority />}
      emptyTitle="Posts"
      emptyDescription="No posts yet. Create your first one to start publishing."
    />
  )
}

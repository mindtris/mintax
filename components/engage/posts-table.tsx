"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataGrid, DataGridColumn, SortState } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Share2, Facebook, Twitter, Linkedin, Instagram, Play, Clock, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import { deletePostAction } from "@/app/(app)/engage/posts/actions"
import { toast } from "sonner"

export type PostRow = {
  id: string
  title: string
  content: string
  status: string
  scheduledAt?: string | Date | null
  publishedAt?: string | Date | null
  socialAccount: { provider: string } | null
  contentType: string
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  published: "default",
  queued: "secondary",
  draft: "outline",
  error: "destructive",
  scheduled: "secondary",
}

const providerIcons: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Play,
  website: Globe,
  blog: Globe,
  doc: FileText,
  legal: FileText,
  "api-docs": Settings2,
  help: Settings2,
  knowledge: History,
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
        const providerName = row.socialAccount?.provider || "Website"
        const ProviderIcon = providerIcons[row.contentType.toLowerCase()] || providerIcons[providerName.toLowerCase()] || Share2
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
              <ProviderIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground truncate max-w-[280px]">{row.title || row.content.slice(0, 50)}</span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[280px] capitalize">
                {providerName}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: "contentType",
      label: "Type",
      sortable: true,
      render: (row) => (
        <Badge variant="secondary" className="h-5 px-2 text-[10px] items-center gap-1.5 font-bold uppercase tracking-wider">
          {row.contentType}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] || "outline"} className="h-5 px-2 text-[10px] font-bold uppercase tracking-wider">
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
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (row) => {
        const isWebsite = !row.socialAccount || row.socialAccount.provider === "Website"
        
        const handleDelete = async (e: React.MouseEvent) => {
          e.stopPropagation()
          if (!confirm("Are you sure you want to delete this post?")) return
          try {
            await deletePostAction(row.id)
            toast.success("Post deleted")
            router.refresh()
          } catch {
            toast.error("Failed to delete post")
          }
        }

        const handleEdit = (e: React.MouseEvent) => {
          e.stopPropagation()
          if (isWebsite) {
            router.push(`/engage/content/${row.id}/edit`)
          } else {
            router.push(`/engage/posts/${row.id}`)
          }
        }

        const handleView = (e: React.MouseEvent) => {
          e.stopPropagation()
          if (isWebsite) {
            window.open(`/engage/content/preview`, "_blank")
          } else {
            router.push(`/engage/posts/${row.id}`)
          }
        }

        return (
          <div className="flex justify-end pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/80 rounded-full">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-border/50">
                <DropdownMenuItem onClick={handleEdit} className="text-xs font-bold gap-2 py-2">
                  <Edit className="h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleView} className="text-xs font-bold gap-2 py-2">
                  <Eye className="h-3.5 w-3.5" /> View
                </DropdownMenuItem>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-xs font-bold gap-2 py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [router])

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
      onRowClick={(row) => {
        const isWebsite = !row.socialAccount || row.socialAccount.provider === "Website"
        if (isWebsite) {
          router.push(`/engage/content/${row.id}/edit`)
        } else {
          router.push(`/engage/posts/${row.id}`)
        }
      }}
      emptyIcon={<Image src="/empty-state.svg" alt="No posts" width={120} height={120} priority />}
      emptyTitle="Posts"
      emptyDescription="No posts yet. Create your first one to start publishing."
    />
  )
}

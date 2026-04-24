"use client"

import { PostsTable } from "./posts-table"
import { EngageSearchAndFilters } from "./filters"
import { NewPostSheet } from "./new-post-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Newspaper } from "lucide-react"
import { useState } from "react"

const ALL_COLUMNS = [
  { key: "content", label: "Post" },
  { key: "contentType", label: "Type" },
  { key: "status", label: "Status" },
  { key: "scheduledAt", label: "Date" },
]

import Link from "next/link"

export function PostsViewClient({
  posts,
  total,
  stats,
  categories,
  type = "social",
  defaultOpenSheet = false,
}: {
  posts: any[]
  total: number
  stats: any
  categories: any[]
  type?: "social" | "content" | "all"
  defaultOpenSheet?: boolean
}) {
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map((c) => c.key))
  const [sheetOpen, setSheetOpen] = useState(defaultOpenSheet)

  const toggleColumn = (key: string) => {
    if (key === "content") return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  const isContentOnly = type === "content"
  const isAll = type === "all"
  const title = isAll ? "Social" : isContentOnly ? "Website content" : "Social distribution"

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">{title}</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-border/50 border shadow-sm">
            {total}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild className="shadow-md">
            <Link href="/engage/content/new">
              <Plus className="h-4 w-4 mr-2" />
              New
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Published</div>
            <div className="text-2xl font-bold mt-1">{stats.published || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Scheduled</div>
            <div className="text-2xl font-bold mt-1">{stats.queued || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Drafts</div>
            <div className="text-2xl font-bold mt-1">{stats.draft || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-destructive">Errors</div>
            <div className="text-2xl font-bold text-destructive mt-1">{stats.error || 0}</div>
          </CardContent>
        </Card>
      </div>

      <EngageSearchAndFilters
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        categories={categories}
      />

      <PostsTable posts={posts} visibleColumns={visibleColumns} />
    </div>
  )
}

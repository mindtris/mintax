"use client"

import { PostsTable } from "./posts-table"
import { EngageSearchAndFilters } from "./filters"
import { NewPostSheet } from "./new-post-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"

const ALL_COLUMNS = [
  { key: "content", label: "Post" },
  { key: "status", label: "Status" },
  { key: "scheduledAt", label: "Date" },
]

export function PostsViewClient({
  posts,
  total,
  stats,
  categories,
}: {
  posts: any[]
  total: number
  stats: any
  categories: any[]
}) {
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map((c) => c.key))

  const toggleColumn = (key: string) => {
    if (key === "content") return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Posts</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {total}
          </div>
        </div>
        <NewPostSheet categories={categories}>
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden md:block">New post</span>
          </Button>
        </NewPostSheet>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-[#141413]">Published</div>
            <div className="text-2xl font-bold mt-1">{stats.published || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-[#141413]">Scheduled</div>
            <div className="text-2xl font-bold mt-1">{stats.queued || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-[#141413]">Drafts</div>
            <div className="text-2xl font-bold mt-1">{stats.draft || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
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

"use client"

import { JobsTable } from "./jobs-table"
import { HireSearchAndFilters } from "./filters"
import { NewJobSheet } from "./new-job-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Copy, ExternalLink, Plus, Rss, Share2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const ALL_COLUMNS = [
  { key: "title", label: "Position" },
  { key: "status", label: "Status" },
  { key: "candidates", label: "Applicants" },
  { key: "salary", label: "Budget" },
  { key: "createdAt", label: "Posted" },
]

export function JobsViewClient({
  jobs,
  total,
  analytics,
  categories,
  currency,
  orgSlug,
}: {
  jobs: any[]
  total: number
  analytics: any
  categories: any[]
  currency: string
  orgSlug?: string
}) {
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map((c) => c.key))

  const toggleColumn = (key: string) => {
    if (key === "title") return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Jobs</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {total}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {orgSlug && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden md:block">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/careers/${orgSlug}`); toast.success("Career page URL copied") }}>
                  <Copy className="h-4 w-4" /> Copy career page URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/jobs/feed?org=${orgSlug}`); toast.success("RSS feed URL copied") }}>
                  <Rss className="h-4 w-4" /> Copy RSS feed URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/careers/${orgSlug}`, "_blank")}>
                  <ExternalLink className="h-4 w-4" /> View career page
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <NewJobSheet categories={categories} currency={currency}>
            <Button>
              <Plus className="h-4 w-4" />
              <span className="hidden md:block">Post job</span>
            </Button>
          </NewJobSheet>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-[#141413]">Total jobs</div>
            <div className="text-2xl font-bold mt-1">{analytics.total}</div>
          </CardContent>
        </Card>
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-emerald-600">Open</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{analytics.open || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-[#141413]">Applicants</div>
            <div className="text-2xl font-bold mt-1">{analytics.totalApplicants}</div>
          </CardContent>
        </Card>
      </div>

      <HireSearchAndFilters
        tab="jobs"
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
      />

      <JobsTable jobs={jobs} visibleColumns={visibleColumns} />
    </div>
  )
}

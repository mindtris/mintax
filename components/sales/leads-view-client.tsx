"use client"

import { LeadsTable } from "./leads-table"
import { LeadsSearchAndFilters } from "./leads-filters"
import { NewLeadSheet } from "./new-lead-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"

const ALL_COLUMNS = [
  { key: "title", label: "Lead" },
  { key: "stage", label: "Stage" },
  { key: "source", label: "Source" },
  { key: "value", label: "Value" },
  { key: "probability", label: "Prob." },
  { key: "createdAt", label: "Created" },
]

export function LeadsViewClient({
  leads,
  total,
  stats,
  currency,
  categories,
}: {
  leads: any[]
  total: number
  stats: any
  currency: string
  categories: any[]
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
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Leads</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-border/50 border shadow-sm">
            {total}
          </div>
        </div>
        <NewLeadSheet currency={currency} categories={categories}>
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden md:block">New lead</span>
          </Button>
        </NewLeadSheet>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Open leads</div>
            <div className="text-2xl font-bold mt-1">{stats.open}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Pipeline value</div>
            <div className="text-2xl font-bold mt-1 font-mono">
              {(stats.pipelineValue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-emerald-600">Won</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.won}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-destructive">Lost</div>
            <div className="text-2xl font-bold text-destructive mt-1">{stats.lost}</div>
          </CardContent>
        </Card>
      </div>

      <LeadsSearchAndFilters
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        categories={categories}
      />

      <LeadsTable leads={leads} visibleColumns={visibleColumns} currency={currency} categories={categories} />
    </div>
  )
}

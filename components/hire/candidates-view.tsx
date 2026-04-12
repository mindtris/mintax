"use client"

import { CandidatesTable } from "./candidates-table"
import { HireSearchAndFilters } from "./filters"
import { NewCandidateSheet } from "./new-candidate-sheet"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"

const ALL_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "status", label: "Stage" },
  { key: "jobTitle", label: "Position" },
  { key: "phone", label: "Phone" },
  { key: "createdAt", label: "Applied" },
]

export function CandidatesViewClient({
  candidates,
  total,
  tab = "candidates",
}: {
  candidates: any[]
  total: number
  tab?: string
}) {
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map((c) => c.key))

  const toggleColumn = (key: string) => {
    if (key === "name") return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">
            {tab === "bench" ? "Bench" : tab === "screening" ? "Screening" : tab === "offers" ? "Offers" : "Candidates"}
          </h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-border/50 border shadow-sm">
            {total}
          </div>
        </div>
        <NewCandidateSheet defaultGroup={tab === "bench" ? "BENCH" : "ATS"}>
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden md:block">{tab === "bench" ? "Add resource" : "Add candidate"}</span>
          </Button>
        </NewCandidateSheet>
      </header>

      <HireSearchAndFilters
        tab={tab}
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
      />

      <CandidatesTable candidates={candidates} tab={tab} visibleColumns={visibleColumns} />
    </div>
  )
}

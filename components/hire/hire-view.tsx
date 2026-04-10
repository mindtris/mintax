"use client"

import { JobsTable } from "./jobs-table"
import { CandidatesTable } from "./candidates-table"
import { Button } from "@/components/ui/button"
import { Plus, Briefcase, Users, Target, Clock, Filter } from "lucide-react"
import { NewJobSheet } from "@/components/hire/new-job-sheet"
import { Badge } from "@/components/ui/badge"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { HireSearchAndFilters } from "./filters"

export function HireView({ 
  tab, 
  data,
  total,
  analytics,
  categories,
  org 
}: { 
  tab: string, 
  data: any[],
  total: number,
  analytics: any,
  categories: any[],
  org: any
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabs = [
    { id: "jobs", label: "Job openings", icon: Briefcase },
    { id: "candidates", label: "Talent pool", icon: Users },
    { id: "bench", label: "Bench resources", icon: Target },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display uppercase">Hire</h1>
          <Badge variant="secondary" className="text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03]">
            {total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
            <NewJobSheet categories={categories} currency={org.baseCurrency}>
                <Button className="font-bold uppercase tracking-tight h-10 px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    {tab === "jobs" ? "Post new job" : "Add candidate"}
                </Button>
            </NewJobSheet>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsCard 
            title="Total jobs" 
            value={analytics.total} 
            subtitle={`${analytics.open || 0} active`}
            icon={Briefcase} 
            color="bg-indigo-500/10 text-indigo-600" 
        />
        <AnalyticsCard 
            title="Applicants" 
            value={analytics.totalApplicants} 
            subtitle="Across all posts"
            icon={Users} 
            color="bg-blue-500/10 text-blue-600" 
        />
        <AnalyticsCard 
            title="Talent pool" 
            value={data.length} 
            subtitle="Qualified leads"
            icon={Target} 
            color="bg-purple-500/10 text-purple-600" 
        />
        <AnalyticsCard 
            title="Bench" 
            value={0} 
            subtitle="Available now"
            icon={Clock} 
            color="bg-orange-500/10 text-orange-600" 
        />
      </div>

      {/* Control Bar (Tabs + Search) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.05] pb-px">
          <div className="flex gap-6">
            {tabs.map((t) => {
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.set("tab", t.id)
                      // Reset search when switching tabs to avoid confusion
                      params.delete("search") 
                      router.push(`?${params.toString()}`)
                  }}
                  className={cn(
                    "flex items-center gap-2 px-1 py-4 text-[11px] font-bold uppercase tracking-[0.1em] transition-all relative",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className={cn("h-3.5 w-3.5", isActive ? "text-indigo-600" : "text-muted-foreground/50")} />
                  {t.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <HireSearchAndFilters tab={tab} />
      </div>

      {/* Data Grid Section */}
      <main className="bg-card border border-black/[0.05] rounded-2xl overflow-hidden shadow-sm">
        {tab === "jobs" ? (
          <JobsTable jobs={data} />
        ) : (
          <CandidatesTable candidates={data} tab={tab} />
        )}
      </main>
    </div>
  )
}

function AnalyticsCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-card rounded-2xl border border-black/[0.05] shadow-sm p-6 flex flex-col gap-4 hover:border-black/10 transition-colors group">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tighter font-display tabular-nums">{value}</span>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{subtitle}</span>
        </div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">{title}</div>
      </div>
    </div>
  )
}

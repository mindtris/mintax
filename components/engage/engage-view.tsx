"use client"

import { PostsTable } from "./posts-table"
import { Button } from "@/components/ui/button"
import { Plus, Share2, LayoutDashboard, Share, Newspaper, Clock, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EngageSearchAndFilters } from "./filters"
import { useRouter, useSearchParams } from "next/navigation"

export function EngageView({ 
  tab, 
  data, 
  total,
  stats 
}: { 
  tab: string, 
  data: any[],
  total: number,
  stats: any
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabs = [
    { id: "social", label: "Distribution Feed", icon: Share2 },
    // Add other content types here if needed
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display uppercase">Engage</h1>
          <Badge variant="secondary" className="text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-border/50">
            {total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="font-bold uppercase tracking-tight h-10 border-input">
                <Link href="/engage/calendar">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                </Link>
            </Button>
            <Button asChild className="font-bold uppercase tracking-tight h-10 px-6">
                <Link href="/engage/social/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Draft Post
                </Link>
            </Button>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsCard 
            title="Published Posts" 
            value={stats.published || 0} 
            subtitle="Live content"
            icon={Share} 
            color="bg-green-500/10 text-green-600" 
        />
        <AnalyticsCard 
            title="Scheduled" 
            value={stats.queued || 0} 
            subtitle="Pending release"
            icon={Clock} 
            color="bg-indigo-500/10 text-indigo-600" 
        />
        <AnalyticsCard 
            title="Draft Assets" 
            value={stats.draft || 0} 
            subtitle="Work in progress"
            icon={Newspaper} 
            color="bg-blue-500/10 text-blue-600" 
        />
        <AnalyticsCard 
            title="Transmission Error" 
            value={stats.error || 0} 
            subtitle="Needs attention"
            icon={AlertCircle} 
            color="bg-red-500/10 text-red-600" 
        />
      </div>

      {/* Control Bar (Tabs + Search) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-px">
          <div className="flex gap-6">
            {tabs.map((t) => {
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.set("tab", t.id)
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

        <EngageSearchAndFilters />
      </div>

      {/* Data Grid Section */}
      <main className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {tab === "social" ? (
          <PostsTable posts={data} />
        ) : (
          <div className="py-24 flex flex-col items-center justify-center">
            <Share2 className="w-10 h-10 text-muted-foreground/20 mb-4" />
            <h3 className="font-bold text-lg tracking-tight font-display uppercase italic opacity-20">{tab} pipeline coming soon</h3>
          </div>
        )}
      </main>
    </div>
  )
}

function AnalyticsCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 hover:border-input transition-colors group">
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

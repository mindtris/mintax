"use client"

import { InvoicesTable } from "./invoices-table"
import { EstimatesTable } from "./estimates-table"
import { Button } from "@/components/ui/button"
import { Plus, Receipt, FileText, TrendingUp, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SalesSearchAndFilters } from "./filters"
import { useRouter, useSearchParams } from "next/navigation"

export function SalesView({ 
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
    { id: "invoices", label: "Accounts Receivable", icon: Receipt },
    { id: "estimates", label: "Proposals / Estimates", icon: FileText },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display uppercase">Sales</h1>
          <Badge variant="secondary" className="text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-border/50">
            {total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="font-bold uppercase tracking-tight h-10 border-input">
                <Link href="/import/csv">
                    Import
                </Link>
            </Button>
            <Button asChild className="font-bold uppercase tracking-tight h-10 px-6">
                <Link href={tab === "invoices" ? "/invoices/new" : "/invoices/new?type=estimate"}>
                    <Plus className="h-4 w-4 mr-2" />
                    New {tab === "invoices" ? "invoice" : "estimate"}
                </Link>
            </Button>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnalyticsCard 
            title="Accounts Receivable" 
            amount={stats.outstanding.total} 
            subtitle={`${stats.outstanding.count} Pending collection`}
            icon={TrendingUp} 
            color="bg-orange-500/10 text-orange-600" 
        />
        <AnalyticsCard 
            title="Overdue Portfolios" 
            amount={stats.overdue.total} 
            subtitle={`${stats.overdue.count} Past maturity`}
            icon={AlertTriangle} 
            color="bg-red-500/10 text-red-600" 
        />
        <AnalyticsCard 
            title="Captured Revenue" 
            amount={stats.paid.total} 
            subtitle={`${stats.paid.count} Settled records`}
            icon={CheckCircle2} 
            color="bg-green-500/10 text-green-600" 
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
                      params.delete("q") 
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

        <SalesSearchAndFilters />
      </div>

      {/* Data Grid Section */}
      <main className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {tab === "invoices" ? (
          <InvoicesTable invoices={data} />
        ) : (
          <EstimatesTable estimates={data} />
        )}
      </main>
    </div>
  )
}

function AnalyticsCard({ title, amount, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 hover:border-input transition-colors group">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tighter font-display tabular-nums">
                {(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{subtitle}</span>
        </div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">{title}</div>
      </div>
    </div>
  )
}

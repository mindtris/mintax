"use client"

import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  icon: React.ElementType
  iconClassName: string
  className?: string
}

function StatCard({ label, value, icon: Icon, iconClassName, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 flex items-start gap-3",
        className
      )}
    >
      <div className={cn("rounded-lg p-2", iconClassName)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight truncate">{value}</p>
      </div>
    </div>
  )
}

interface ContactStatsCardsProps {
  currency?: string
  stats: {
    totalInvoiced: number
    totalPaid: number
    totalOutstanding: number
    totalOverdue: number
  }
}

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

export function ContactStatsCards({ stats, currency = "INR" }: ContactStatsCardsProps) {
  const fmt = (n: number) => formatCurrency(n, currency)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Total invoiced"
        value={fmt(stats.totalInvoiced)}
        icon={TrendingUp}
        iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
      />
      <StatCard
        label="Paid"
        value={fmt(stats.totalPaid)}
        icon={CheckCircle2}
        iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
      />
      <StatCard
        label="Outstanding"
        value={fmt(stats.totalOutstanding)}
        icon={Clock}
        iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
      />
      <StatCard
        label="Overdue"
        value={fmt(stats.totalOverdue)}
        icon={AlertTriangle}
        iconClassName="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
      />
    </div>
  )
}

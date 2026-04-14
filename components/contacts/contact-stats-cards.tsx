"use client"

import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CheckCircle2,
  Timer,
  ReceiptText,
} from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  icon: React.ElementType
  iconClassName: string
  className?: string
}

function StatCard({ label, value, icon: Icon, iconClassName, className }: StatCardProps) {
  // Extract text color from iconClassName if possible, or just use it directly on the icon
  // The iconClassName usually contains "text-..."
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 flex items-center gap-4 shadow-sm shadow-black/[0.01] transition-all hover:border-primary/20 hover:shadow-md",
        className
      )}
    >
      <div className="shrink-0">
        <Icon className={cn("h-8 w-8 opacity-80", iconClassName.split(" ").find(c => c.startsWith("text-")))} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight truncate text-foreground">{value}</p>
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

export function ContactStatsCards({ stats, currency = "INR" }: ContactStatsCardsProps) {
  const fmt = (n: number) => formatCurrency(n, currency)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        label="Total invoiced"
        value={fmt(stats.totalInvoiced)}
        icon={ReceiptText}
        iconClassName="text-primary"
      />
      <StatCard
        label="Paid"
        value={fmt(stats.totalPaid)}
        icon={CheckCircle2}
        iconClassName="text-primary"
      />
      <StatCard
        label="Outstanding"
        value={fmt(stats.totalOutstanding)}
        icon={Timer}
        iconClassName="text-primary"
      />
      <StatCard
        label="Overdue"
        value={fmt(stats.totalOverdue)}
        icon={AlertCircle}
        iconClassName="text-primary"
      />
    </div>
  )
}

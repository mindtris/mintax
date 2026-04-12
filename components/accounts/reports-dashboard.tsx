"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FinancialTable } from "@/components/reports/financial-table"
import { ReportPeriodSelector } from "@/components/reports/filters"
import { useReportFilters } from "@/lib/hooks/use-report-filters"
import { BarChart3, TrendingDown, TrendingUp, Wallet } from "lucide-react"

export function ReportsDashboard({ 
  stats, 
  accountBalances,
  orgName
}: { 
  stats: any, 
  accountBalances: any[],
  orgName: string
}) {
  const { filters, setPeriod, setFilters } = useReportFilters()

  const assets = accountBalances.filter((a) => a.type === "asset")
  const liabilities = accountBalances.filter((a) => a.type === "liability")
  const revenue = accountBalances.filter((a) => a.type === "revenue")
  const expenses = accountBalances.filter((a) => a.type === "expense")

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Reports</h1>
        </div>
        <ReportPeriodSelector filters={filters} setPeriod={setPeriod} setFilters={setFilters} />
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-card-foreground">Total income</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-2 font-mono tracking-tighter">
              {Object.entries(stats.totalIncomePerCurrency || {}).map(([currency, amount]: [string, any]) => (
                <div key={currency}>
                  {(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs opacity-70 font-sans tracking-normal">{currency}</span>
                </div>
              ))}
              {Object.keys(stats.totalIncomePerCurrency || {}).length === 0 && "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-card-foreground">Total expenses</span>
            </div>
            <div className="text-2xl font-bold text-red-600 mt-2 font-mono tracking-tighter">
              {Object.entries(stats.totalExpensesPerCurrency || {}).map(([currency, amount]: [string, any]) => (
                <div key={currency}>
                  {(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs opacity-70 font-sans tracking-normal">{currency}</span>
                </div>
              ))}
              {Object.keys(stats.totalExpensesPerCurrency || {}).length === 0 && "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-card-foreground">Net profit</span>
            </div>
            <div className="text-2xl font-bold mt-2 font-mono tracking-tighter">
              {Object.entries(stats.profitPerCurrency || {}).map(([currency, amount]: [string, any]) => (
                <div key={currency} className={amount >= 0 ? "text-green-600" : "text-red-600"}>
                  {(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs opacity-70 font-sans tracking-normal">{currency}</span>
                </div>
              ))}
              {Object.keys(stats.profitPerCurrency || {}).length === 0 && "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-card-foreground">Transactions</span>
            </div>
            <div className="text-2xl font-bold mt-2 font-mono tracking-tighter">{stats.invoicesProcessed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FinancialTable 
          title="Profit & Loss" 
          rows={revenue.concat(expenses)} 
          type="neutral"
        />
        <FinancialTable 
          title="Balance Sheet" 
          rows={assets.concat(liabilities)} 
          type="neutral"
        />
      </div>
    </div>
  )
}

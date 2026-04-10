import { FiltersWidget } from "@/components/dashboard/filters-widget"
import { IncomeExpenseGraph } from "@/components/dashboard/income-expense-graph"
import { ProjectsWidget } from "@/components/dashboard/projects-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkline } from "@/components/dashboard/sparkline"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { formatCurrency } from "@/lib/utils"
import { getProjects } from "@/lib/services/projects"
import { getSettings } from "@/lib/services/settings"
import { getDashboardStats, getDetailedTimeSeriesStats, getProjectStats } from "@/lib/services/stats"
import { TransactionFilters } from "@/lib/services/transactions"
import Link from "next/link"
import { cn } from "@/lib/utils"

function StatCard({
  title,
  value,
  chartData,
  href,
  color = "#c96442"
}: {
  title: string;
  value: string;
  chartData: any;
  href: string;
  color?: string;
}) {
  return (
    <Link href={href}>
      <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden transition-all hover:shadow-md cursor-pointer h-full flex flex-col">
        <div className="p-5 pb-2 flex-1">
          <p className="text-sm font-medium text-[#141413] mb-1">{title}</p>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="px-0 pb-0 mt-auto">
          <Sparkline data={chartData} color={color} height={60} />
        </div>
      </Card>
    </Link>
  )
}

export async function StatsWidget({ filters }: { filters: TransactionFilters }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const projects = await getProjects(org.id)
  const settings = await getSettings(org.id)
  const defaultCurrency = settings.default_currency || "INR"

  const stats = await getDashboardStats(org.id, filters)
  const statsTimeSeries = await getDetailedTimeSeriesStats(org.id, filters, defaultCurrency)
  const statsPerProject = Object.fromEntries(
    await Promise.all(
      projects.map((project) => getProjectStats(org.id, project.code, filters).then((stats) => [project.code, stats]))
    )
  )

  const labels = statsTimeSeries.map(d => d.date)

  const incomeChart = {
    labels,
    datasets: [{ data: statsTimeSeries.map(d => d.income) }]
  }

  const expenseChart = {
    labels,
    datasets: [{ data: statsTimeSeries.map(d => d.expenses) }]
  }

  const profitChart = {
    labels,
    datasets: [{ data: statsTimeSeries.map(d => d.income - d.expenses) }]
  }

  const transactionChart = {
    labels,
    datasets: [{ data: statsTimeSeries.map(d => d.totalTransactions) }]
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
        <FiltersWidget defaultFilters={filters} defaultRange="last-12-months" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total income"
          href="/transactions?type=income"
          value={Object.entries(stats.totalIncomePerCurrency)[0] ? formatCurrency(Object.entries(stats.totalIncomePerCurrency)[0][1], Object.entries(stats.totalIncomePerCurrency)[0][0]) : "0.00"}
          chartData={incomeChart}
          color="--chart-1"
        />

        <StatCard
          title="Total expenses"
          href="/transactions?type=expense"
          value={Object.entries(stats.totalExpensesPerCurrency)[0] ? formatCurrency(Object.entries(stats.totalExpensesPerCurrency)[0][1], Object.entries(stats.totalExpensesPerCurrency)[0][0]) : "0.00"}
          chartData={expenseChart}
          color="--chart-5"
        />

        <StatCard
          title="Net profit"
          href="/transactions"
          value={Object.entries(stats.profitPerCurrency)[0] ? formatCurrency(Object.entries(stats.profitPerCurrency)[0][1], Object.entries(stats.profitPerCurrency)[0][0]) : "0.00"}
          chartData={profitChart}
          color="--primary"
        />

        <StatCard
          title="Transactions"
          href="/transactions"
          value={stats.invoicesProcessed.toString()}
          chartData={transactionChart}
          color="--muted-foreground"
        />
      </div>
    </div>
  )
}

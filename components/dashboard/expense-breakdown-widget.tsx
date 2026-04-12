"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DoughnutChart from "@/components/ui/charts/doughnut-chart"
import { DetailedTimeSeriesData } from "@/lib/services/stats"
import { formatCurrency } from "@/lib/utils"

interface ExpenseBreakdownWidgetProps {
  data: DetailedTimeSeriesData[]
}

export function ExpenseBreakdownWidget({ data }: ExpenseBreakdownWidgetProps) {
  const { theme } = useTheme()
  const darkMode = theme === "dark"

  // Aggregate category totals
  const categoryTotals: Record<string, { name: string; amount: number; color: string }> = {}
  let totalExpenses = 0

  data.forEach((period) => {
    period.categories.forEach((cat) => {
      if (cat.expenses > 0) {
        if (!categoryTotals[cat.code]) {
          categoryTotals[cat.code] = { name: cat.name, amount: 0, color: cat.color || "#6b7280" }
        }
        categoryTotals[cat.code].amount += cat.expenses
        totalExpenses += cat.expenses
      }
    })
  })

  // Sort by amount descending and take top 5 + others
  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount)

  const chartLabels = sortedCategories.map(c => c.name)
  const chartDataPoints = sortedCategories.map(c => c.amount / 100)
  const chartColors = sortedCategories.map(c => c.color)

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Expenses",
        data: chartDataPoints,
        backgroundColor: chartColors,
        borderWidth: 0,
      },
    ],
  }

  return (
    <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden h-full flex flex-col">
      <CardHeader className="px-6 py-4 border-b border-black/[0.03]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Expense breakdown</CardTitle>
          <div className="text-right">
            <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Total Expenses</p>
            <p className="text-sm font-semibold">{formatCurrency(totalExpenses, "INR")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {totalExpenses > 0 ? (
          <div className="flex-1 min-h-[300px] w-full p-6 lg:p-10">
            <DoughnutChart data={chartData} />
          </div>
        ) : (
          <div className="flex-1 h-[480px] flex flex-col items-center justify-center py-12 text-muted-foreground p-6">
            <p className="text-sm">No expenses recorded for this period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCssVariable } from "@/components/utils/utils"
import { TimeSeriesData } from "@/lib/services/stats"
import { formatCurrency } from "@/lib/utils"
import { useRef, useState, useEffect } from "react"
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js"
import "chartjs-adapter-moment"
import { chartColors } from "@/components/charts/chartjs-config"

Chart.register(
  BarController,
  BarElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend
)

interface ProfitLossWidgetProps {
  data: TimeSeriesData[]
}

export function ProfitLossWidget({ data }: ProfitLossWidgetProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [chart, setChart] = useState<Chart | null>(null)
  const { theme } = useTheme()
  const darkMode = theme === "dark"
  const { textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  useEffect(() => {
    const ctx = canvas.current
    if (!ctx || data.length === 0) return

    const incomeColor = `hsl(${getCssVariable("--chart-1") || "14 53% 43%"})`
    const expenseColor = `hsl(${getCssVariable("--chart-2") || "254 85% 74%"})`

    const newChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((d) => d.date),
        datasets: [
          {
            label: "Income",
            data: data.map((d) => d.income / 100),
            backgroundColor: incomeColor,
            hoverBackgroundColor: incomeColor,
            categoryPercentage: 0.6,
            barPercentage: 0.8,
            borderRadius: 4,
          },
          {
            label: "Expense",
            data: data.map((d) => d.expenses / 100),
            backgroundColor: expenseColor,
            hoverBackgroundColor: expenseColor,
            categoryPercentage: 0.6,
            barPercentage: 0.8,
            borderRadius: 4,
          },
        ],
      },
      options: {
        layout: {
          padding: {
            top: 12,
            bottom: 16,
            left: 20,
            right: 20,
          },
        },
        scales: {
          y: {
            border: { display: false },
            beginAtZero: true,
            ticks: {
              maxTicksLimit: 5,
              callback: (value) => formatCurrency(Number(value) * 100, "INR"),
              color: darkMode ? textColor.dark : textColor.light,
            },
            grid: {
              color: darkMode ? gridColor.dark : gridColor.light,
            },
          },
          x: {
            type: "time",
            time: {
              unit: "month",
              displayFormats: {
                month: "MMM YY",
              },
            },
            border: { display: false },
            grid: { display: false },
            ticks: {
              color: darkMode ? textColor.dark : textColor.light,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20,
              font: { size: 11 },
              color: darkMode ? textColor.dark : textColor.light,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${formatCurrency(Number(context.parsed.y) * 100, "INR")}`,
            },
            bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
            backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
            borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
          },
        },
        interaction: {
          intersect: false,
          mode: "nearest",
        },
        maintainAspectRatio: false,
      },
    })

    setChart(newChart)
    return () => newChart.destroy()
  }, [data])

  useEffect(() => {
    if (!chart) return

    if (darkMode) {
      chart.options.scales!.x!.ticks!.color = textColor.dark
      chart.options.scales!.y!.ticks!.color = textColor.dark
      chart.options.scales!.y!.grid!.color = gridColor.dark
      chart.options.plugins!.legend!.labels!.color = textColor.dark
    } else {
      chart.options.scales!.x!.ticks!.color = textColor.light
      chart.options.scales!.y!.ticks!.color = textColor.light
      chart.options.scales!.y!.grid!.color = gridColor.light
      chart.options.plugins!.legend!.labels!.color = textColor.light
    }
    chart.update("none")
  }, [theme])

  return (
    <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden h-full flex flex-col">
      <CardHeader className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Profit and loss</CardTitle>
            <p className="text-xs text-muted-foreground">Income and expenses only (includes unpaid invoices and bills).</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-[280px] w-full mt-4">
          <canvas ref={canvas}></canvas>
        </div>
      </CardContent>
    </Card>
  )
}

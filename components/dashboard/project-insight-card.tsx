"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TimeSeriesData, ProjectStats } from "@/lib/services/stats"
import { Project } from "@/lib/prisma/client"
import { formatCurrency } from "@/lib/utils"
import { getCssVariable } from "@/components/utils/utils"
import { useRef, useState, useEffect, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js"
import "chartjs-adapter-moment"
import { chartColors } from "@/components/ui/charts/chartjs-config"

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend
)

interface ProjectInsightCardProps {
  projects: Project[]
  statsPerProject: Record<string, ProjectStats>
  timeSeriesPerProject: Record<string, TimeSeriesData[]>
}

export function ProjectInsightCard({ projects, statsPerProject, timeSeriesPerProject }: ProjectInsightCardProps) {
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>(projects[0]?.code || "")
  const canvas = useRef<HTMLCanvasElement>(null)
  const [chart, setChart] = useState<Chart | null>(null)
  const { theme } = useTheme()
  const darkMode = theme === "dark"
  const { textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  const selectedProject = projects.find(p => p.code === selectedProjectCode)
  const currentStats = statsPerProject[selectedProjectCode]
  const currentData = timeSeriesPerProject[selectedProjectCode] || []

  const netProfit = useMemo(() => {
    if (!currentStats) return 0
    return Object.values(currentStats.profitPerCurrency).reduce((acc, val) => acc + val, 0)
  }, [currentStats])

  const totalIncome = useMemo(() => {
    if (!currentStats) return 0
    return Object.values(currentStats.totalIncomePerCurrency).reduce((acc, val) => acc + val, 0)
  }, [currentStats])

  const totalExpenses = useMemo(() => {
    if (!currentStats) return 0
    return Object.values(currentStats.totalExpensesPerCurrency).reduce((acc, val) => acc + val, 0)
  }, [currentStats])

  useEffect(() => {
    const ctx = canvas.current
    if (!ctx) return

    if (chart) {
      chart.destroy()
    }

    const incomeColor = `hsl(${getCssVariable("--chart-1") || "14 53% 43%"})`
    const expenseColor = `hsl(${getCssVariable("--chart-2") || "254 85% 74%"})`

    const newChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: currentData.map((d) => d.date),
        datasets: [
          {
            label: "Income",
            data: currentData.map((d) => d.income / 100),
            borderColor: incomeColor,
            backgroundColor: incomeColor,
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: false,
          },
          {
            label: "Expenses",
            data: currentData.map((d) => d.expenses / 100),
            borderColor: expenseColor,
            backgroundColor: expenseColor,
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        layout: {
          padding: { top: 12, bottom: 0, left: 10, right: 10 },
        },
        scales: {
          y: {
            border: { display: false },
            beginAtZero: true,
            ticks: {
              maxTicksLimit: 5,
              callback: (value) => formatCurrency(Number(value) * 100, "INR"),
              color: darkMode ? textColor.dark : textColor.light,
              font: { size: 10 }
            },
            grid: {
              color: darkMode ? gridColor.dark : gridColor.light,
            },
          },
          x: {
            type: "time",
            time: {
              unit: "month",
              displayFormats: { month: "MMM YY" },
            },
            border: { display: false },
            grid: { display: false },
            ticks: {
              color: darkMode ? textColor.dark : textColor.light,
              font: { size: 10 }
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              boxWidth: 8,
              usePointStyle: true,
              pointStyle: "circle",
              padding: 15,
              font: { size: 10 },
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
        maintainAspectRatio: false,
      },
    })

    setChart(newChart)
    return () => newChart.destroy()
  }, [currentData, selectedProjectCode, darkMode, textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor])

  return (
    <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden min-h-[350px] flex flex-col">
      <CardHeader className="px-6 py-4 border-b border-black/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Project insights</CardTitle>
            <p className="text-xs text-muted-foreground">Detailed performance analysis per project.</p>
          </div>
          <div className="w-[180px]">
            <Select value={selectedProjectCode} onValueChange={setSelectedProjectCode}>
              <SelectTrigger className="w-full text-xs font-medium">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.code} value={project.code} className="text-xs">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
          {/* Summary Stats */}
          <div className="flex flex-col justify-center space-y-6 border-r border-black/[0.03] pr-8">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1">Current net profit</p>
              <p className={`text-3xl font-bold tracking-tight ${netProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                {formatCurrency(netProfit, "INR")}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1">Income</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(totalIncome, "INR")}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1">Expenses</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(totalExpenses, "INR")}</p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                Project Code: {selectedProjectCode}
              </span>
            </div>
          </div>

          {/* Chart View */}
          <div className="h-[220px] w-full relative">
            <canvas ref={canvas}></canvas>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

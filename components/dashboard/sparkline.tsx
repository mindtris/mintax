"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import {
  Chart,
  LineController,
  LineElement,
  Filler,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  ChartData,
} from "chart.js"
import "chartjs-adapter-moment"

import { chartColors } from "@/components/charts/chartjs-config"
import { safeDestroyChart } from "@/lib/utils/chart-utils"
import { getCssVariable } from "@/components/utils/utils"

Chart.register(LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, Tooltip)

interface SparklineProps {
  data: ChartData
  height?: number
  color?: string
}

export function Sparkline({ data, height = 60, color = "--primary" }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [chart, setChart] = useState<Chart | null>(null)
  const { theme } = useTheme()
  const darkMode = theme === "dark"
  const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  const resolvedColor = color.startsWith("--") 
    ? `hsl(${getCssVariable(color) || "14 53% 53%"})` 
    : color

  useEffect(() => {
    const ctx = canvasRef.current
    if (!ctx) return

    safeDestroyChart(chart)

    const newChart = new Chart(ctx, {
      type: "line",
      data: {
        ...data,
        datasets: data.datasets.map((ds) => ({
          ...ds,
          borderColor: resolvedColor,
          backgroundColor: (context: any) => {
            const chart = context.chart
            const { ctx, chartArea } = chart
            if (!chartArea) return null
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
            gradient.addColorStop(0, "rgba(201, 100, 66, 0)")
            gradient.addColorStop(1, "rgba(201, 100, 66, 0.15)")
            return gradient
          },
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: resolvedColor,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
          tension: 0.4, // Smooth curves
        })),
      },
      options: {
        layout: {
          padding: { top: 5, bottom: 5, left: 0, right: 0 },
        },
        scales: {
          x: {
            display: false,
            type: "time",
          },
          y: {
            display: false,
            beginAtZero: false,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            intersect: false,
            mode: "index",
            callbacks: {
              title: () => "",
              label: (context) => {
                let label = context.dataset.label || ""
                if (label) label += ": "
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    notation: "compact",
                  }).format(context.parsed.y)
                }
                return label
              },
            },
            bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
            backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
            borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
            borderWidth: 1,
          },
        },
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "nearest",
        },
      },
    })

    setChart(newChart)

    return () => {
      safeDestroyChart(newChart)
    }
  }, [data, darkMode, color])

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

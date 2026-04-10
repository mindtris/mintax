// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useChart } from '@/lib/hooks/use-chart'
import { chartColors } from '@/components/charts/chartjs-config'
import {
  Chart, LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, Tooltip,
} from 'chart.js'
import type { ChartData, ChartConfiguration } from 'chart.js'
import 'chartjs-adapter-moment'

// Import utilities
import { formatValue } from '@/components/utils/utils'

Chart.register(LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, Tooltip)

interface LineChart01SafeProps {
  data: ChartData
  width: number
  height: number
}

export default function LineChart01Safe({
  data,
  width,
  height
}: LineChart01SafeProps) {
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  const chartConfig: ChartConfiguration = {
    type: 'line',
    data: data,
    options: {
      layout: {
        padding: 20,
      },
      scales: {
        y: {
          display: false,
          beginAtZero: true,
        },
        x: {
          type: 'time',
          time: {
            parser: 'MM-DD-YYYY',
            unit: 'month',
          },
          display: false,
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: () => '', // Disable tooltip title
            label: (context) => formatValue(context.parsed.y),
          },
          bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
          backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
          borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,            
        },
        legend: {
          display: false,
        },
      },
      interaction: {
        intersect: false,
        mode: 'nearest',
      },
      maintainAspectRatio: false,
      resizeDelay: 200,
    },
  }

  const { canvasRef, updateChart } = useChart(chartConfig)

  // Update chart when theme changes
  useEffect(() => {
    updateChart({
      options: {
        plugins: {
          tooltip: {
            bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
            backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
            borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
          },
        },
      },
    })
  }, [theme, darkMode, tooltipBodyColor, tooltipBgColor, tooltipBorderColor, updateChart])

  return (
    <canvas ref={canvasRef} width={width} height={height}></canvas>
  )
}

import type { Chart } from "chart.js"

export function safeDestroyChart(chart: Chart | null | undefined): void {
  if (chart && typeof chart.destroy === "function") {
    try {
      chart.destroy()
    } catch {
      // ignore
    }
  }
}

export function safeUpdateChart(chart: Chart | null | undefined): void {
  if (chart && typeof chart.update === "function") {
    try {
      chart.update()
    } catch {
      // ignore
    }
  }
}

export function isChartValid(chart: Chart | null | undefined): boolean {
  return !!(chart && chart.canvas && chart.ctx)
}

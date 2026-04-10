"use client"

import { useRef, useCallback } from "react"
import type { Chart } from "chart.js"

export function useChart() {
  const chartRef = useRef<Chart | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node
  }, [])

  return {
    chartRef,
    canvasRef,
    setCanvasRef,
    chart: chartRef.current,
    canvas: canvasRef.current,
  }
}

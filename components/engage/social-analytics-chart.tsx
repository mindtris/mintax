"use client"

import { useEffect, useState } from "react"
import BarChart01 from "@/components/ui/charts/bar-chart-01"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function SocialAnalyticsChart() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/social/analytics?days=30")
      .then(r => r.json())
      .then(d => {
        const chartData = {
          labels: d.daily.map((v: any) => v.date),
          datasets: [
            {
              label: 'Impressions',
              data: d.daily.map((v: any) => v.impressions),
              backgroundColor: '#6366f1',
              hoverBackgroundColor: '#4f46e5',
              barPercentage: 0.66,
              categoryPercentage: 0.66,
            },
            {
              label: 'Engagements',
              data: d.daily.map((v: any) => v.engagements),
              backgroundColor: '#10b981',
              hoverBackgroundColor: '#059669',
              barPercentage: 0.66,
              categoryPercentage: 0.66,
            }
          ]
        }
        setData(chartData)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch analytics:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (!data || data.labels.length === 0) {
    return (
      <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">No analytics data available for the last 30 days.</p>
        <p className="text-xs text-muted-foreground mt-1">Metrics will appear here once your posts gain visibility.</p>
      </Card>
    )
  }

  return (
    <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-black/[0.03]">
        <CardTitle className="text-sm font-medium">Performance Trends (30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <BarChart01 data={data} width={595} height={248} />
      </CardContent>
    </Card>
  )
}

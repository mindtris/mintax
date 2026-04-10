"use client"

import { DateRangePicker } from "@/components/forms/date-range-picker"
import { ReportFilters } from "@/lib/hooks/use-report-filters"
import { format } from "date-fns"

export function ReportPeriodSelector({
  filters,
  setPeriod,
  setFilters,
}: {
  filters: ReportFilters
  setPeriod: (preset: any) => void
  setFilters: (filters: ReportFilters) => void
}) {
  return (
    <DateRangePicker
      defaultDate={{
        from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        to: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }}
      defaultRange="all-time"
      onChange={(date) => {
        setFilters({
          dateFrom: date && date.from ? format(date.from, "yyyy-MM-dd") : undefined,
          dateTo: date && date.to ? format(date.to, "yyyy-MM-dd") : undefined,
        })
      }}
    />
  )
}

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns"

export type ReportFilters = {
  dateFrom?: string
  dateTo?: string
}

const filterKeys = ["dateFrom", "dateTo"]

export function useReportFilters(defaultFilters?: ReportFilters) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<ReportFilters>({
    ...defaultFilters,
    ...searchParamsToFilters(searchParams),
  })

  useEffect(() => {
    const newSearchParams = filtersToSearchParams(filters, searchParams)
    router.push(`?${newSearchParams.toString()}`, { scroll: false })
  }, [filters])

  useEffect(() => {
    setFilters(searchParamsToFilters(searchParams))
  }, [searchParams])

  const setPeriod = (preset: "this-month" | "last-month" | "this-year" | "last-year" | "all-time") => {
    const now = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (preset) {
      case "this-month":
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      case "last-month":
        from = startOfMonth(subMonths(now, 1))
        to = endOfMonth(subMonths(now, 1))
        break
      case "this-year":
        from = startOfYear(now)
        to = endOfYear(now)
        break
      case "last-year":
        from = startOfYear(new Date(now.getFullYear() - 1, 0, 1))
        to = endOfYear(new Date(now.getFullYear() - 1, 11, 31))
        break
      case "all-time":
        from = undefined
        to = undefined
        break
    }

    setFilters({
      dateFrom: from ? format(from, "yyyy-MM-dd") : "",
      dateTo: to ? format(to, "yyyy-MM-dd") : "",
    })
  }

  return { filters, setFilters, setPeriod }
}

export function searchParamsToFilters(searchParams: URLSearchParams) {
  return filterKeys.reduce((acc, filter) => {
    acc[filter] = searchParams.get(filter) || ""
    return acc
  }, {} as Record<string, string>) as ReportFilters
}

export function filtersToSearchParams(
  filters: ReportFilters,
  currentSearchParams?: URLSearchParams
): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (currentSearchParams) {
    currentSearchParams.forEach((value, key) => {
      if (!filterKeys.includes(key)) {
        searchParams.set(key, value)
      }
    })
  }

  if (filters.dateFrom) {
    searchParams.set("dateFrom", filters.dateFrom)
  } else {
    searchParams.delete("dateFrom")
  }

  if (filters.dateTo) {
    searchParams.set("dateTo", filters.dateTo)
  } else {
    searchParams.delete("dateTo")
  }

  // Ensure 'tab' is preserved
  if (currentSearchParams?.get("tab")) {
    searchParams.set("tab", currentSearchParams.get("tab")!)
  }

  return searchParams
}

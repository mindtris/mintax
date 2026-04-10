import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export interface HireFilters {
  search?: string
  status?: string
  tab?: string
  ordering?: string
}

const filterKeys = ["search", "status", "tab", "ordering"]

export function useHireFilters(defaultFilters?: HireFilters) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<HireFilters>({
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

  return [filters, setFilters] as const
}

export function searchParamsToFilters(searchParams: URLSearchParams): HireFilters {
  return filterKeys.reduce((acc, filter) => {
    const val = searchParams.get(filter)
    if (val) acc[filter as keyof HireFilters] = val
    return acc
  }, {} as HireFilters)
}

export function filtersToSearchParams(
  filters: HireFilters,
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

  if (filters.search) {
    searchParams.set("search", filters.search)
  } else {
    searchParams.delete("search")
  }

  if (filters.status && filters.status !== "-") {
    searchParams.set("status", filters.status)
  } else {
    searchParams.delete("status")
  }

  if (filters.tab) {
    searchParams.set("tab", filters.tab)
  } else {
    searchParams.delete("tab")
  }

  if (filters.ordering) {
    searchParams.set("ordering", filters.ordering)
  } else {
    searchParams.delete("ordering")
  }

  return searchParams
}

export function isFiltered(filters: HireFilters) {
  const { tab, ordering, ...rest } = filters
  return Object.values(rest).some((value) => value && value !== "" && value !== "-")
}

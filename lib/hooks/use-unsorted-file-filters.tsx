import { UnsortedFileFilters } from "@/lib/services/files"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const filterKeys = ["search"]

export function useUnsortedFileFilters(defaultFilters?: UnsortedFileFilters) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<UnsortedFileFilters>({
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

export function searchParamsToFilters(searchParams: URLSearchParams) {
  return filterKeys.reduce((acc, filter) => {
    acc[filter] = searchParams.get(filter) || ""
    return acc
  }, {} as Record<string, string>) as UnsortedFileFilters
}

export function filtersToSearchParams(
  filters: UnsortedFileFilters,
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

  // Ensure 'tab' is preserved
  if (currentSearchParams?.get("tab")) {
    searchParams.set("tab", currentSearchParams.get("tab")!)
  }

  return searchParams
}

export function isFiltered(filters: UnsortedFileFilters) {
  return Object.values(filters).some((value) => value !== "")
}

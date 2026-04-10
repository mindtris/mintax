import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ContactFilters } from "@/lib/services/contacts"

const filterKeys = ["q", "type", "country", "ordering"]

export function useContactFilters(defaultFilters?: ContactFilters & { ordering?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<ContactFilters & { ordering?: string }>({
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
  }, {} as Record<string, any>)
}

export function filtersToSearchParams(
  filters: Record<string, any>,
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

  if (filters.q) {
    searchParams.set("q", filters.q)
  } else {
    searchParams.delete("q")
  }

  if (filters.type && filters.type !== "all" && filters.type !== "-") {
    searchParams.set("type", filters.type)
  } else {
    searchParams.delete("type")
  }

  if (filters.country && filters.country !== "-") {
    searchParams.set("country", filters.country)
  } else {
    searchParams.delete("country")
  }

  if (filters.ordering) {
    searchParams.set("ordering", filters.ordering)
  } else {
    searchParams.delete("ordering")
  }

  return searchParams
}

export function isFiltered(filters: Record<string, any>) {
  return Object.values(filters).some((value) => value !== "" && value !== "-" && value !== "all")
}

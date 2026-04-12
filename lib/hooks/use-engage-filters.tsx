import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { SocialPostFilters } from "@/lib/services/social-posts"

const filterKeys = ["search", "status", "provider", "category", "ordering"]

export function useEngageFilters(defaultFilters?: SocialPostFilters & { ordering?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<SocialPostFilters & { ordering?: string }>({
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

  if (filters.provider && filters.provider !== "-") {
    searchParams.set("provider", filters.provider)
  } else {
    searchParams.delete("provider")
  }

  if (filters.ordering) {
    searchParams.set("ordering", filters.ordering)
  } else {
    searchParams.delete("ordering")
  }

  return searchParams
}

export function isFiltered(filters: Record<string, any>) {
  return Object.values(filters).some((value) => value !== "" && value !== "-")
}

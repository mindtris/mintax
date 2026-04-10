import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { InvoiceFilters } from "@/lib/services/invoices"

const filterKeys = ["q", "status", "ordering"]

export function useSalesFilters(defaultFilters?: InvoiceFilters & { ordering?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<InvoiceFilters & { ordering?: string }>({
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

  if (filters.status && filters.status !== "-") {
    searchParams.set("status", filters.status)
  } else {
    searchParams.delete("status")
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

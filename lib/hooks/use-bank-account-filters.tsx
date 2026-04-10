import { BankAccountFilters } from "@/lib/services/bank-accounts"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const filterKeys = ["search", "accountType"]

export function useBankAccountFilters(defaultFilters?: BankAccountFilters) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<BankAccountFilters>({
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
  }, {} as Record<string, string>) as BankAccountFilters
}

export function filtersToSearchParams(
  filters: BankAccountFilters,
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

  if (filters.accountType && filters.accountType !== "-") {
    searchParams.set("accountType", filters.accountType)
  } else {
    searchParams.delete("accountType")
  }

  // Ensure 'tab' is preserved
  if (currentSearchParams?.get("tab")) {
    searchParams.set("tab", currentSearchParams.get("tab")!)
  }

  return searchParams
}

export function isFiltered(filters: BankAccountFilters) {
  return Object.values(filters).some((value) => value !== "" && value !== "-")
}

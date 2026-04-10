import { useEffect, useState } from "react"

const STORAGE_KEY = "mintax_bill_columns"

export type BillColumnKey = 
  | "billNumber"
  | "vendorName"
  | "status"
  | "issuedAt"
  | "dueAt"
  | "total"
  | "paidAt"

export function useBillVisibility() {
  const [visibleColumns, setVisibleColumns] = useState<BillColumnKey[]>([
    "billNumber",
    "vendorName",
    "status",
    "issuedAt",
    "dueAt",
    "total",
  ])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setVisibleColumns(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse stored bill columns", e)
      }
    }
  }, [])

  const toggleColumn = (key: BillColumnKey) => {
    setVisibleColumns((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { visibleColumns, toggleColumn }
}

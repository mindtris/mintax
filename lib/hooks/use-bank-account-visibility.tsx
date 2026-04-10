import { useEffect, useState } from "react"

export type BankAccountColumnKey = "name" | "accountNumber" | "accountType" | "currentBalance"

const STORAGE_KEY = "mintax_bank_account_columns"

const DEFAULT_COLUMNS: BankAccountColumnKey[] = ["name", "accountNumber", "accountType", "currentBalance"]

export function useBankAccountVisibility() {
  const [visibleColumns, setVisibleColumns] = useState<BankAccountColumnKey[]>(DEFAULT_COLUMNS)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setVisibleColumns(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse visible columns", e)
      }
    }
  }, [])

  const toggleColumn = (key: BankAccountColumnKey) => {
    const next = visibleColumns.includes(key)
      ? visibleColumns.filter((c) => c !== key)
      : [...visibleColumns, key]
    
    // Ensure 'name' is always visible
    if (!next.includes("name")) return

    setVisibleColumns(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { visibleColumns, toggleColumn }
}

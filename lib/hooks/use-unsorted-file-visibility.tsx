import { useEffect, useState } from "react"

export type UnsortedFileColumnKey = "filename" | "createdAt" | "size" | "type"

const STORAGE_KEY = "mintax_unsorted_file_columns"

const DEFAULT_COLUMNS: UnsortedFileColumnKey[] = ["filename", "createdAt", "size", "type"]

export function useUnsortedFileVisibility() {
  const [visibleColumns, setVisibleColumns] = useState<UnsortedFileColumnKey[]>(DEFAULT_COLUMNS)

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

  const toggleColumn = (key: UnsortedFileColumnKey) => {
    const next = visibleColumns.includes(key)
      ? visibleColumns.filter((c) => c !== key)
      : [...visibleColumns, key]
    
    // Ensure 'filename' is always visible
    if (!next.includes("filename")) return

    setVisibleColumns(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { visibleColumns, toggleColumn }
}

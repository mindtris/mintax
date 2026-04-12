"use client"

import { parseCSVAction, saveTransactionsAction } from "@/app/(app)/import/csv/actions"
import { toast } from "sonner"
import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Field } from "@/lib/prisma/client"
import { Loader2, Play, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useState } from "react"

const MAX_PREVIEW_ROWS = 100

export function ImportCSVTable({ fields }: { fields: Field[] }) {
  const router = useRouter()
  const [parseState, parseAction, isParsing] = useActionState(parseCSVAction, null)
  const [saveState, saveAction, isSaving] = useActionState(saveTransactionsAction, null)

  const [csvSettings, setCSVSettings] = useState({
    skipHeader: true,
  })
  const [csvData, setCSVData] = useState<string[][]>([])
  const [columnMappings, setColumnMappings] = useState<string[]>([])

  useEffect(() => {
    if (parseState?.success && parseState.data) {
      const parsedData = parseState.data as string[][]
      setCSVData(parsedData)
      if (parsedData.length > 0) {
        setColumnMappings(
          parsedData[0].map((value) => {
            const field = fields.find((field) => field.code === value || field.name === value)
            return field?.code || ""
          })
        )
      } else {
        setColumnMappings([])
      }
    }
  }, [parseState, fields])

  useEffect(() => {
    if (saveState?.success) {
      router.push("/transactions")
    }
  }, [saveState, router])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      await parseAction(formData)
    })
  }

  const handleMappingChange = (columnIndex: number, fieldCode: string) => {
    setColumnMappings((prev) => {
      const state = [...prev]
      state[columnIndex] = fieldCode
      return state
    })
  }

  const handleSave = async () => {
    if (csvData.length === 0) return

    if (!isAtLeastOneFieldMapped(columnMappings)) {
      toast.error("Please map at least one column to a field")
      return
    }

    const startIndex = csvSettings.skipHeader ? 1 : 0
    const processedRows = csvData.slice(startIndex).map((row) => {
      const processedRow: Record<string, unknown> = {}

      columnMappings.forEach((fieldCode, columnIndex) => {
        if (!fieldCode || !row[columnIndex]) return
        processedRow[fieldCode] = row[columnIndex]
      })

      return processedRow
    })

    const formData = new FormData()
    formData.append("rows", JSON.stringify(processedRows))

    startTransition(async () => {
      await saveAction(formData)
    })
  }

  return (
    <>
      {csvData.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[400px]">
          <p className="text-muted-foreground">Upload your CSV file to import transactions</p>
          <div className="flex flex-row gap-5 mt-8">
            <div>
              <input type="file" accept=".csv" className="hidden" id="csv-file" onChange={handleFileChange} />
              <Button type="button" onClick={() => document.getElementById("csv-file")?.click()}>
                {isParsing ? "Parsing..." : <Upload className="mr-2" />} Import from CSV
              </Button>
            </div>
          </div>
          {parseState?.error && <FormError>{parseState.error}</FormError>}
        </div>
      )}

      {csvData.length > 0 && (
        <div>
          <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
            <h2 className="flex flex-row gap-3 md:gap-5">
              <span className="text-3xl font-bold tracking-tight">Import {csvData.length} items from CSV</span>
            </h2>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Play /> Import {csvData.length} transactions
                  </>
                )}
              </Button>
            </div>
          </header>

          {saveState?.error && <FormError>{saveState.error}</FormError>}

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                id="skip-header"
                defaultChecked={csvSettings.skipHeader}
                onChange={(e) => setCSVSettings({ ...csvSettings, skipHeader: e.target.checked })}
              />
              <span>First row is a header</span>
            </label>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {csvData[0].map((_, index) => (
                    <TableHead key={index} className="min-w-[200px]">
                      <select
                        className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={columnMappings[index] || ""}
                        onChange={(e) => handleMappingChange(index, e.target.value)}
                      >
                        <option value="">Skip column</option>
                        {fields.map((field) => (
                          <option key={field.code} value={field.code}>
                            {field.name}
                          </option>
                        ))}
                      </select>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvData.slice(0, MAX_PREVIEW_ROWS).map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={
                      rowIndex === 0 && csvSettings.skipHeader
                        ? "line-through text-muted-foreground"
                        : ""
                    }
                  >
                    {csvData[0].map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        {(row[colIndex] || "").toString().slice(0, 256)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {csvData.length > MAX_PREVIEW_ROWS && (
            <p className="text-muted-foreground mt-4">and {csvData.length - MAX_PREVIEW_ROWS} more entries...</p>
          )}
        </div>
      )}
    </>
  )
}

function isAtLeastOneFieldMapped(columnMappings: string[]) {
  return columnMappings.some((mapping) => mapping !== "")
}

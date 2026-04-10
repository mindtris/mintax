"use client"

import { useMemo, useState } from "react"
import { DataGrid } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { Category, Currency, Field, File, Project } from "@/lib/prisma/client"
import { FileText, Clock, FileType } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { useUnsortedFileFilters } from "@/lib/hooks/use-unsorted-file-filters"
import { useUnsortedFileVisibility, UnsortedFileColumnKey } from "@/lib/hooks/use-unsorted-file-visibility"
import { UnsortedSearchAndFilters } from "./filters"
import { AnalyzeFileSheet } from "./analyze-file-sheet"

export function UnsortedFileTable({
  files,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: {
  files: File[]
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}) {
  const { visibleColumns, toggleColumn } = useUnsortedFileVisibility()
  const [filters, setFilters] = useUnsortedFileFilters()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const allColumns = useMemo(() => [
    {
      key: "filename",
      label: "File name",
      render: (file: File) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 overflow-hidden">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground truncate">{file.filename}</span>
            <span className="text-[10px] text-muted-foreground font-medium">Queued</span>
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Uploaded",
      render: (file: File) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{format(new Date(file.createdAt), "MMM dd, yyyy HH:mm")}</span>
        </div>
      ),
    },
    {
      key: "size",
      label: "Size",
      render: (file: File) => {
        const sizeInMb = ((file as any).size || 0) / (1024 * 1024)
        return <span className="text-xs text-muted-foreground font-mono">{sizeInMb.toFixed(2)} MB</span>
      },
    },
    {
      key: "type",
      label: "Type",
      render: (file: File) => (
        <Badge variant="outline" className="text-[10px] font-bold border-black/[0.08] bg-black/[0.02] uppercase tracking-wider">
          {file.mimetype?.split("/")[1] || "File"}
        </Badge>
      ),
    },
  ], [])

  const dynamicColumns = useMemo(() => {
    return allColumns.filter((col) => visibleColumns.includes(col.key as UnsortedFileColumnKey))
  }, [visibleColumns, allColumns])

  return (
    <div className="space-y-4">
      <UnsortedSearchAndFilters
        filters={filters}
        setFilters={setFilters}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
      />

      <DataGrid
        data={files}
        columns={dynamicColumns}
        onRowClick={(file) => {
          setSelectedFile(file)
          setSheetOpen(true)
        }}
        emptyIcon={
          <Image 
            src="/empty-state.svg" 
            alt="No unsorted files" 
            width={120} 
            height={120} 
            priority
          />
        }
        emptyTitle="Processing queue clear"
        emptyDescription="Everything is analyzed! Drag and drop new files to start your next batch."
      />

      <AnalyzeFileSheet
        file={selectedFile}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        categories={categories}
        projects={projects}
        currencies={currencies}
        fields={fields}
        settings={settings}
      />
    </div>
  )
}

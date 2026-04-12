"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { FilePreview } from "@/components/files/preview"
import AnalyzeForm from "./analyze-form"
import { Category, Currency, Field, File, Project } from "@/lib/prisma/client"
import { FileText } from "lucide-react"

export function AnalyzeFileSheet({
  file,
  open,
  onOpenChange,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: {
  file: File | null
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}) {
  if (!file) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-4xl flex flex-col gap-0 p-0 overflow-hidden border-border shadow-2xl"
      >
        <SheetHeader className="px-8 pt-8 pb-6 shrink-0 bg-muted/5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-xl font-bold tracking-tight">Analyze processing queue</SheetTitle>
              <p className="text-xs text-muted-foreground">{file.filename}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Left: Preview */}
            <div className="border-r border-border bg-muted/5 p-6 overflow-y-auto">
              <div className="sticky top-0 bg-card rounded-md border border-border overflow-hidden shadow-sm">
                <FilePreview file={file} />
              </div>
            </div>

            {/* Right: Form */}
            <div className="overflow-y-auto px-8 py-8 h-full bg-white">
              <AnalyzeForm
                file={file}
                categories={categories}
                projects={projects}
                currencies={currencies}
                fields={fields}
                settings={settings}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

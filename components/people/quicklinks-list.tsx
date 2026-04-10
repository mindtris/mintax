"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid } from "@/components/ui/data-grid"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnsIcon, ExternalLink, Link as LinkIcon, Search, X } from "lucide-react"
import { useMemo, useState } from "react"

type QuicklinkRow = {
  id: string
  title: string
  url: string
  category: string
}

type ColumnKey = "title" | "category" | "url"

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "url", label: "URL" },
  { key: "category", label: "Category" },
]

export function QuicklinksList({ links }: { links: QuicklinkRow[] }) {
  const [search, setSearch] = useState("")
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(["title", "url", "category"])

  const filtered = useMemo(() => {
    if (!search) return links
    const q = search.toLowerCase()
    return links.filter(
      (l) => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
    )
  }, [links, search])

  const getDomain = (url: string) => {
    try { return new URL(url).hostname.replace("www.", "") } catch { return url }
  }

  const allColumns = useMemo(() => [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row: QuicklinkRow) => {
        const domain = getDomain(row.url)
        const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : ""
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="h-9 w-9 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 overflow-hidden">
              {faviconUrl ? (
                <img src={faviconUrl} alt={domain} className="h-5 w-5 object-contain" onError={(e) => { e.currentTarget.style.display = "none" }} />
              ) : (
                <LinkIcon className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{row.title}</span>
              <span className="text-[11px] text-muted-foreground">{domain}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: "url",
      label: "URL",
      render: (row: QuicklinkRow) => (
        <a href={row.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
          <ExternalLink className="h-3 w-3" />
          <span className="truncate max-w-[200px]">{getDomain(row.url)}</span>
        </a>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (row: QuicklinkRow) => (
        <Badge variant="outline" className="text-[10px] font-medium border-black/[0.08] bg-black/[0.02]">
          {row.category}
        </Badge>
      ),
    },
  ], [])

  const dynamicColumns = useMemo(() => {
    return allColumns.filter((col) => visibleColumns.includes(col.key as ColumnKey))
  }, [visibleColumns, allColumns])

  const toggleColumn = (key: ColumnKey) => {
    if (key === "title") return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quicklinks..."
            defaultValue={search}
            onKeyDown={(e) => { if (e.key === "Enter") setSearch((e.target as HTMLInputElement).value) }}
            className="w-full pl-9 bg-background/50"
          />
        </div>

        {search && (
          <Button variant="ghost" size="icon" onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground" title="Clear search">
            <X className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Select table columns">
              <ColumnsIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {ALL_COLUMNS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visibleColumns.includes(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
                disabled={col.key === "title"}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataGrid
        data={filtered}
        columns={dynamicColumns}
        onRowClick={(row) => window.open(row.url, "_blank")}
        emptyTitle="Quicklinks"
        emptyDescription="No quicklinks added yet. Add your first link to get started."
      />
    </div>
  )
}

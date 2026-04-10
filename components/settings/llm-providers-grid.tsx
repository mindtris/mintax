"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataGrid, DataGridColumn } from "@/components/ui/data-grid"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { PROVIDERS } from "@/lib/integrations/llm-providers"
import { Columns3, EllipsisVertical, ExternalLink, Filter, Plus, Save, Search, X } from "lucide-react"
import { useActionState, useEffect, useMemo, useState } from "react"
import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { toast } from "sonner"

type ProviderRow = {
  key: string
  label: string
  apiKey: string
  model: string
  baseUrl: string
  apiDoc: string
  apiDocLabel: string
  hasBaseUrl: boolean
}

export function LLMProvidersGrid({ settings }: { settings: Record<string, string> }) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)
  const [search, setSearch] = useState("")
  const [editingProvider, setEditingProvider] = useState<ProviderRow | null>(null)
  const [formData, setFormData] = useState<{ apiKey: string; model: string; baseUrl: string }>({ apiKey: "", model: "", baseUrl: "" })

  useEffect(() => {
    if (saveState?.success) toast.success("Provider settings saved")
    if (saveState?.error) toast.error(saveState.error)
  }, [saveState])

  const rows: ProviderRow[] = useMemo(() =>
    PROVIDERS.map((p) => ({
      key: p.key,
      label: p.label,
      apiKey: settings[p.apiKeyName] || "",
      model: settings[p.modelName] || p.defaultModelName,
      baseUrl: p.baseUrlName ? settings[p.baseUrlName] || p.defaultBaseUrl || "" : "",
      apiDoc: p.apiDoc,
      apiDocLabel: p.apiDocLabel,
      hasBaseUrl: !!p.baseUrlName,
    })),
    [settings]
  )

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => r.label.toLowerCase().includes(q) || r.model.toLowerCase().includes(q))
  }, [rows, search])

  const openEdit = (row: ProviderRow) => {
    setFormData({ apiKey: row.apiKey, model: row.model, baseUrl: row.baseUrl })
    setEditingProvider(row)
  }

  const maskKey = (key: string) => {
    if (!key) return ""
    if (key.length <= 8) return "••••••••"
    return key.slice(0, 4) + "••••" + key.slice(-4)
  }

  const columns: DataGridColumn<ProviderRow>[] = [
    {
      key: "label",
      label: "Provider",
      className: "font-semibold",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.label}</span>
        </div>
      ),
    },
    {
      key: "apiKey",
      label: "API key",
      render: (row) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.apiKey ? maskKey(row.apiKey) : <span className="text-muted-foreground/40">Not configured</span>}
        </span>
      ),
    },
    {
      key: "model",
      label: "Model",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs">{row.model || "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant={row.apiKey ? "default" : "outline"} className="text-[10px]">
          {row.apiKey ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "__actions",
      label: "",
      align: "right",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row)}>
              Configure
            </DropdownMenuItem>
            {row.apiDoc && (
              <DropdownMenuItem onClick={() => window.open(row.apiDoc, "_blank")}>
                <ExternalLink className="h-4 w-4" />
                Get API key
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const openNewProvider = () => {
    const compatible = rows.find((r) => r.key === "openai_compatible")
    if (compatible) openEdit(compatible)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header — matches CrudTable / social page pattern */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">LLM providers</h2>
            <div className="bg-secondary text-sm px-2 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
              {rows.length}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure API keys and models for each AI provider.
          </p>
        </div>
        <Button onClick={openNewProvider}>
          <Plus className="h-4 w-4" />
          <span className="hidden md:block">Add new</span>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            defaultValue={search}
            onKeyDown={(e) => { if (e.key === "Enter") setSearch((e.target as HTMLInputElement).value) }}
            className="w-full pl-9 bg-background/50"
          />
        </div>

        {search && (
          <Button variant="ghost" size="icon" onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Grid */}
      <DataGrid
        data={filtered}
        columns={columns}
        getRowId={(row) => row.key}
        emptyTitle="No providers"
        emptyDescription="No LLM providers match your search."
      />

      {/* Edit sheet */}
      <Sheet open={!!editingProvider} onOpenChange={(open) => !open && setEditingProvider(null)}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-auto max-h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Configure {editingProvider?.label}</SheetTitle>
          </SheetHeader>
          <form action={saveAction}>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">API key</label>
                <Input
                  name={editingProvider ? PROVIDERS.find(p => p.key === editingProvider.key)?.apiKeyName : ""}
                  value={formData.apiKey}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  type="password"
                />
                {editingProvider?.apiDoc && (
                  <a href={editingProvider.apiDoc} target="_blank" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Get key from {editingProvider.apiDocLabel}
                  </a>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Model name</label>
                <Input
                  name={editingProvider ? PROVIDERS.find(p => p.key === editingProvider.key)?.modelName : ""}
                  value={formData.model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="gpt-4o-mini"
                />
              </div>
              {editingProvider?.hasBaseUrl && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Base URL</label>
                  <Input
                    name={editingProvider ? PROVIDERS.find(p => p.key === editingProvider.key)?.baseUrlName : ""}
                    value={formData.baseUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="http://localhost:11434/v1"
                  />
                </div>
              )}
            </div>
            <SheetFooter className="px-6 py-4 shrink-0 border-t">
              <div className="flex gap-2 w-full">
                <Button type="submit" disabled={pending} className="flex-1" onClick={() => setTimeout(() => setEditingProvider(null), 500)}>
                  {pending ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingProvider(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

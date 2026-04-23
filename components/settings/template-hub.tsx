"use client"

import { EmailTemplate as DbTemplate, User, Organization, Currency, ContentTemplate } from "@/lib/prisma/client"
import { SettingsMap } from "@/lib/services/settings"
import { InvoiceAppData } from "@/app/(app)/apps/invoices/page"
import { DataGrid, DataGridColumn } from "@/components/ui/data-grid"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import { useState, useMemo, useCallback, useRef } from "react"
import { CheckCircle2, FileText, Mail, Quote, Search, Filter, Columns3, X, Megaphone, Plus, Loader2, Send, Pencil, Eye, ShipWheel, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import EmailTemplateSettingsForm, { EmailEditorHandle } from "./email-template-settings-form"
import ContentTemplateForm from "./content-template-form"
import InvoiceTemplateForm, { InvoiceFormHandle } from "./invoice-template-form"
import { InvoicePage } from "@/app/(app)/apps/invoices/components/invoice-page"
import defaultTemplates from "@/app/(app)/apps/invoices/default-templates"
import { TEMPLATE_REGISTRY } from "@/lib/constants/email-templates"

// ─── Shared Types ────────────────────────────────────────────────────────────

type TemplateType = "email" | "invoice" | "estimate" | "social"

interface UnifiedTemplate {
  id: string
  name: string
  type: TemplateType
  category: string
  status: "Default" | "Customized"
  raw: any // Original template object (DbTemplate or InvoiceTemplate)
}

interface Props {
  user: User
  org: Organization
  settings: SettingsMap
  currencies: Currency[]
  invoiceAppData: InvoiceAppData | null
  estimateAppData: any | null // Similar structure to InvoiceAppData
  emailTemplates: DbTemplate[]
  contentTemplates: ContentTemplate[]
}

const CATEGORY_COLORS: Record<string, string> = {
  Accounting: "bg-primary/10 text-primary border-primary/20",
  Pipeline: "bg-accent/10 text-accent-foreground border-accent-200/50",
  Hire: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  Others: "bg-muted text-muted-foreground border-muted/50",
  Social: "bg-blue-500/10 text-blue-600 border-blue-200",
}

export default function TemplateHub({
  user,
  org,
  settings,
  currencies,
  invoiceAppData,
  estimateAppData,
  emailTemplates,
  contentTemplates
}: Props) {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<UnifiedTemplate | null>(null)
  const [isCreating, setIsCreating] = useState<TemplateType | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [activeSubTab, setActiveSubTab] = useState<string>("edit")
  const [search, setSearch] = useState("")
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

  // Ref for imperative actions
  const emailEditorRef = useRef<EmailEditorHandle | null>(null)
  const invoiceEditorRef = useRef<InvoiceFormHandle | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // 1. Transform Email Templates
  const emailRows: UnifiedTemplate[] = useMemo(() => {
    return TEMPLATE_REGISTRY.map(reg => {
      const dbTpl = emailTemplates.find(t => t.module === reg.module && t.event === reg.event)
      return {
        id: `email_${reg.module}_${reg.event}`,
        name: reg.name,
        type: "email" as const,
        category: reg.category,
        status: dbTpl ? "Customized" : "Default",
        raw: { ...reg, dbTemplate: dbTpl }
      }
    })
  }, [emailTemplates])

  // 2. Transform Invoice Templates
  const invoiceRows: UnifiedTemplate[] = useMemo(() => {
    const defaults = defaultTemplates(org, settings, user.email || "")
    const custom = invoiceAppData?.templates || []

    return [
      ...defaults.map(t => ({
        id: `default_invoice_${t.name}`,
        name: t.name,
        type: "invoice" as const,
        category: "Accounting",
        status: "Default" as const,
        raw: t
      })),
      ...custom.map(t => ({
        id: t.id || `invoice_${t.name}`,
        name: t.name,
        type: "invoice" as const,
        category: "Accounting",
        status: "Customized" as const,
        raw: t
      }))
    ]
  }, [invoiceAppData, org, settings, user.email])

  // 3. Transform Estimate Templates
  const estimateRows: UnifiedTemplate[] = useMemo(() => {
    const defaults = defaultTemplates(org, settings, user.email || "")
    const custom = estimateAppData?.templates || []

    return [
      ...defaults.map(t => ({
        id: `default_estimate_${t.name}`,
        name: t.name,
        type: "estimate" as const,
        category: "Accounting",
        status: "Default" as const,
        raw: t
      })),
      ...custom.map((t: any) => ({
        id: t.id || `estimate_${t.name}`,
        name: t.name,
        type: "estimate" as const,
        category: "Accounting",
        status: "Customized" as const,
        raw: t
      }))
    ]
  }, [estimateAppData, org, settings])

  // 4. Transform Content Templates
  const contentRows: UnifiedTemplate[] = useMemo(() => {
    return contentTemplates.map(t => ({
      id: t.id,
      name: t.name,
      type: "social" as const,
      category: t.category || "Marketing",
      status: "Customized" as const,
      raw: t
    }))
  }, [contentTemplates])

  const allRows = useMemo(() => [
    ...emailRows,
    ...invoiceRows,
    ...estimateRows,
    ...contentRows
  ], [emailRows, invoiceRows, estimateRows, contentRows])

  const filteredRows = useMemo(() => {
    let result = allRows

    // 1. Tab filtering
    if (activeTab !== "all") {
      result = result.filter(r => r.type === activeTab)
    }

    // 2. Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(row =>
        row.name.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q)
      )
    }

    // 3. Filters
    for (const [key, val] of Object.entries(filters)) {
      if (val && val !== "-") {
        result = result.filter((row) => String(row[key as keyof UnifiedTemplate]) === val)
      }
    }

    return result
  }, [allRows, activeTab, search, filters])

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "-").length
  const isFiltered = !!search || activeFilterCount > 0

  const clearAll = useCallback(() => {
    setSearch("")
    setFilters({})
  }, [])

  const columns: DataGridColumn<UnifiedTemplate>[] = [
    {
      key: "name",
      label: "Template Name",
      className: "font-semibold",
      render: (row) => {
        const Icon = row.type === "email" ? Send :
          row.type === "invoice" ? FileText :
            row.type === "estimate" ? Quote : Megaphone;

        return (
          <div className="flex items-center gap-3 py-1">
            <div className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 border bg-primary/5 border-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">{row.name}</span>
          </div>
        );
      }
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span className="capitalize text-sm font-medium px-3 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/50">
          {row.type}
        </span>
      )
    },
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <span className={`px-3 py-0.5 text-sm font-medium rounded-full border ${CATEGORY_COLORS[row.category] || "bg-muted text-muted-foreground"}`}>
          {row.category}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${row.status === "Customized" ? "text-primary" : "text-muted-foreground"}`}>
          {row.status === "Customized" ? <CheckCircle2 className="w-4 h-4" /> : null}
          {row.status}
        </span>
      )
    },
  ]

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenColumns.has(String(c.key))),
    [columns, hiddenColumns]
  )

  const toggleColumn = (key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleDeleteContent = useCallback(() => {
    // Deletion handled inside ContentTemplateForm; close the sheet
    setSelectedTemplate(null)
    router.refresh()
  }, [router])

  const handleSuccess = useCallback(() => {
    setSelectedTemplate(null)
    setIsCreating(null)
    setActiveSubTab("edit")
    setIsProcessing(false)
    router.refresh()
  }, [router])

  const handleGlobalSave = useCallback(async () => {
    setIsProcessing(true)
    try {
      if (selectedTemplate?.type === "email" || isCreating === "email") {
        await emailEditorRef.current?.save()
      } else if (selectedTemplate?.type === "invoice" || selectedTemplate?.type === "estimate" || isCreating === "invoice" || isCreating === "estimate") {
        await invoiceEditorRef.current?.save()
      } else {
        // Fallback or generic handling
        handleSuccess()
      }
    } catch (error) {
      console.error("Global save failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedTemplate, isCreating, handleSuccess])

  const handleGlobalTest = async () => {
    if (selectedTemplate?.type === "email" && emailEditorRef.current) {
      setIsProcessing(true)
      try {
        await emailEditorRef.current.test()
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized management for all your Invoices, Quotes, and Email communications.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="font-semibold shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuCheckboxItem onClick={() => setIsCreating("invoice")}>
              <FileText className="w-4 h-4 mr-2" />
              Invoice template
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem onClick={() => setIsCreating("estimate")}>
              <Quote className="w-4 h-4 mr-2" />
              Quote template
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem onClick={() => setIsCreating("social")}>
              <Megaphone className="w-4 h-4 mr-2" />
              Social template
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="invoice">Invoices</TabsTrigger>
          <TabsTrigger value="estimate">Quotes</TabsTrigger>
          <TabsTrigger value="email">Emails</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            defaultValue={search}
            onKeyDown={(e) => { if (e.key === "Enter") setSearch((e.target as HTMLInputElement).value) }}
            className="w-full pl-9 bg-background/50"
          />
        </div>

        <Button
          variant={activeFilterCount > 0 ? "default" : "outline"}
          onClick={() => setFilterSheetOpen(true)}
          className="px-4 text-xs"
        >
          <Filter className="h-3.5 w-3.5 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{activeFilterCount}</Badge>
          )}
        </Button>

        {isFiltered && (
          <Button variant="ghost" size="icon" onClick={clearAll} className="text-muted-foreground hover:text-foreground" title="Clear all">
            <X className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Select table columns">
              <Columns3 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={String(col.key)}
                checked={!hiddenColumns.has(String(col.key))}
                onCheckedChange={() => toggleColumn(String(col.key))}
                disabled={String(col.key) === "name"}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataGrid
        data={filteredRows}
        columns={visibleColumns}
        getRowId={(row) => row.id}
        onRowClick={(row) => setSelectedTemplate(row)}
      />

      {/* Filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden shadow-2xl rounded-lg border">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={filters.status || "-"} onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All</SelectItem>
                  <SelectItem value="Default">Default</SelectItem>
                  <SelectItem value="Customized">Customized</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={filters.category || "-"} onValueChange={(v) => setFilters((prev) => ({ ...prev, category: v }))}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">All</SelectItem>
                  <SelectItem value="Accounting">Accounting</SelectItem>
                  <SelectItem value="Pipeline">Pipeline</SelectItem>
                  <SelectItem value="Hire">Hire</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>Apply</Button>
              <Button variant="outline" className="flex-1" onClick={() => { clearAll(); setFilterSheetOpen(false) }}>Clear all</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Editor sheet */}
      <Sheet open={!!selectedTemplate || !!isCreating} onOpenChange={(open) => {
        if (!open) {
          setSelectedTemplate(null)
          setIsCreating(null)
          setActiveSubTab("edit")
        }
      }}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-5xl flex flex-col gap-0 p-0 overflow-hidden shadow-2xl rounded-lg border">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="flex-1 flex flex-col overflow-hidden">
            <SheetHeader className="px-6 py-4 shrink-0 border-b min-h-[72px] flex justify-center">
              <div className="relative flex items-center justify-between w-full">
                {/* Left: Metadata */}
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-lg leading-none">
                    {isCreating ? `Create ${isCreating}` : selectedTemplate?.name}
                  </SheetTitle>
                </div>

                {/* Center: View Switcher (Absolute Centered) */}
                {(selectedTemplate?.type === "email" || isCreating === "email" ||
                  selectedTemplate?.type === "invoice" || isCreating === "invoice" ||
                  selectedTemplate?.type === "estimate" || isCreating === "estimate") && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                      <TabsList className="bg-muted p-1 h-11">
                        <TabsTrigger value="edit" className="px-6 h-9 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="px-6 h-9 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  )}

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {selectedTemplate?.type === "social" && (
                    <Button variant="ghost" size="icon" onClick={handleDeleteContent} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-background">
              {/* This is the elastic body that the child editors will hydrate */}
              <div className="flex-1 min-h-0 flex flex-col">
                {/* Creation Flow */}
                {isCreating === "social" && (
                  <div className="px-6 py-6 h-full overflow-y-auto"><ContentTemplateForm onSuccess={handleSuccess} /></div>
                )}
                {(isCreating === "invoice" || isCreating === "estimate") && (
                  <div className="h-full">
                    <TabsContent value="edit" className="m-0 h-full overflow-y-auto">
                      <InvoiceTemplateForm
                        ref={invoiceEditorRef}
                        user={user}
                        org={org}
                        settings={settings}
                        currencies={currencies}
                        type={isCreating === "invoice" ? "invoice" : "estimate"}
                        onSave={handleSuccess}
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="m-0 h-full p-0">
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Eye className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-foreground">Live Preview Unavailable</p>
                        <p className="text-sm max-w-[240px]">Save your template design first to see the final high-fidelity preview here.</p>
                      </div>
                    </TabsContent>
                  </div>
                )}

                {/* Editing Flow */}
                {selectedTemplate?.type === "email" && (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <EmailTemplateSettingsForm
                      ref={emailEditorRef}
                      orgId={org.id}
                      orgName={org.name}
                      settings={settings}
                      templates={emailTemplates}
                      initialRegistry={selectedTemplate?.raw}
                      initialDbTemplate={selectedTemplate?.raw?.dbTemplate}
                      onSuccess={handleSuccess}
                      activeTab={activeSubTab}
                      pureFormMode={true}
                    />
                  </div>
                )}

                {selectedTemplate?.type === "social" && (
                  <div className="px-6 py-6 h-full overflow-y-auto">
                    <ContentTemplateForm
                      template={selectedTemplate?.raw}
                      onSuccess={handleSuccess}
                    />
                  </div>
                )}

                {(selectedTemplate?.type === "invoice" || selectedTemplate?.type === "estimate") && (
                  <div className="h-full">
                    <TabsContent value="edit" className="m-0 h-full overflow-y-auto">
                      <InvoiceTemplateForm
                        ref={invoiceEditorRef}
                        user={user}
                        org={org}
                        settings={settings}
                        currencies={currencies}
                        type={selectedTemplate.type === "invoice" ? "invoice" : "estimate"}
                        initialData={selectedTemplate.raw}
                        onSave={handleSuccess}
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="m-0 h-full bg-muted/5 flex flex-col overflow-hidden">
                      {/* 1. Scrollable Document Workspace */}
                      <div className="flex-1 overflow-y-auto bg-muted/20 custom-scrollbar relative">
                        {/* Background Overlay for Depth */}
                        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent pointer-events-none" />

                        <div className="relative py-6 px-4 flex flex-col items-center w-full">
                          <div className="w-full max-w-[880px] pb-12">
                            {/* The Document */}
                            <InvoicePage
                              invoiceData={selectedTemplate.raw.formData}
                              dispatch={() => {}}
                              currencies={currencies}
                              readOnly={true}
                            />
                          </div>
                        </div>
                      </div>

                    </TabsContent>
                  </div>
                )}
              </div>

              {/* Functional Anchor: Footer */}
              <div className="px-6 py-4 border-t bg-muted/5 shrink-0 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => { setSelectedTemplate(null); setIsCreating(null); }} className="text-xs font-semibold" disabled={isProcessing}>
                    Cancel
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTemplate?.type === "email" && activeSubTab === "edit" && !isCreating && (
                    <Button
                      variant="outline"
                      onClick={handleGlobalTest}
                      disabled={isProcessing}
                      className="text-xs font-semibold gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Send Test
                    </Button>
                  )}
                  <Button
                    onClick={handleGlobalSave}
                    disabled={isProcessing}
                    className="px-8 font-bold shadow-sm"
                  >
                    {isProcessing ? "Processing..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  )
}

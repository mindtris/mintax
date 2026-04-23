"use client"

import { ContactPicker } from "@/components/contacts/contact-picker"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Loader2, Plus, Trash2, Upload } from "lucide-react"
import { useActionState, useCallback, useEffect, useState } from "react"
import { createInvoiceAction } from "@/app/(app)/invoices/actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditInvoiceForm } from "@/app/(app)/invoices/[invoiceId]/edit-invoice-form"
import { FormSelectCurrency } from "@/components/forms/select-currency"

interface LineItem {
  name: string
  description: string
  quantity: number
  price: number
  taxId: string
  taxAmount: number
  total: number
  itemId: string
}

interface NewInvoiceSheetProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultContactId?: string
  defaultClientName?: string
  baseCurrency?: string
  taxId?: string
  defaultType?: string
  invoiceSettings?: Record<string, string>
  currencies?: { code: string; name: string }[]
  items?: { id: string; name: string; salePrice: number }[]
  taxes?: { id: string; name: string; rate: number; type: string }[]
}

function emptyLine(): LineItem {
  return { name: "", description: "", quantity: 1, price: 0, taxId: "", taxAmount: 0, total: 0, itemId: "" }
}

export function NewInvoiceSheet({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultContactId = "",
  defaultClientName = "",
  baseCurrency = "INR",
  taxId = "",
  defaultType = "sales",
  invoiceSettings = {},
  currencies = [],
  items: settingsItems = [],
  taxes: settingsTaxes = [],
}: NewInvoiceSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const [state, formAction, pending] = useActionState(createInvoiceAction, null)
  
  const [managedId, setManagedId] = useState<string | null>(null)
  const [managedData, setManagedData] = useState<{ invoice: any; files: any[]; org?: any; invoiceSettings?: any } | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [loadingManaged, setLoadingManaged] = useState(false)

  // Handle successful creation
  useEffect(() => {
    if (state?.success && state?.id && !managedId) {
      setManagedId(state.id)
      setActiveTab("preview") // Switch to preview after creation
    }
  }, [state, managedId])

  // Fetch data when we have a managed ID
  useEffect(() => {
    if (managedId && open) {
      fetchManagedData()
    } else if (!open) {
      setManagedId(null)
      setManagedData(null)
      setActiveTab("details")
    }
  }, [managedId, open])

  async function fetchManagedData() {
    if (!managedId) return
    setLoadingManaged(true)
    try {
      const res = await fetch(`/api/invoices/${managedId}`)
      if (res.ok) {
        const json = await res.json()
        setManagedData(json)
      }
    } catch (e) {
      console.error("Failed to fetch managed data", e)
    } finally {
      setLoadingManaged(false)
    }
  }

  const paymentTermsDays = parseInt(invoiceSettings.invoice_payment_terms || "30") || 30
  const today = new Date().toISOString().split("T")[0]
  const defaultDueDate = new Date(Date.now() + paymentTermsDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const isEstimate = defaultType === "estimate"
  const formLabel = isEstimate ? "Estimate" : "Invoice"
  const formLabelLower = isEstimate ? "estimate" : "invoice"

  const [clientName, setClientName] = useState(defaultClientName)
  const [clientEmail, setClientEmail] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientTaxId, setClientTaxId] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [hasSelectedContact, setHasSelectedContact] = useState(false)

  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()])
  const [files, setFiles] = useState<File[]>([])

  function handleContactSelect(
    contact: { name: string; email?: string | null; taxId?: string | null; address?: string | null; city?: string | null; country?: string | null } | null
  ) {
    if (!contact) {
      setClientName(""); setClientEmail(""); setClientAddress(""); setClientTaxId(""); setHasSelectedContact(false)
      return
    }
    setClientName(contact.name); setClientEmail(contact.email ?? ""); setClientTaxId(contact.taxId ?? "")
    setClientAddress([contact.address, contact.city, contact.country].filter(Boolean).join(", "))
    setHasSelectedContact(true)
  }

  const updateLine = useCallback((idx: number, field: keyof LineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev]
      const line = { ...updated[idx], [field]: value }
      if (field === "itemId" && value) {
        const item = settingsItems.find((i) => i.id === value)
        if (item) { line.name = item.name; line.price = item.salePrice || 0 }
      }
      const tax = settingsTaxes.find((t) => t.id === line.taxId)
      line.taxAmount = tax ? Math.round(line.price * line.quantity * tax.rate / 100) : 0
      line.total = line.price * line.quantity + line.taxAmount
      updated[idx] = line
      return updated
    })
  }, [settingsItems, settingsTaxes])

  const addLine = () => setLineItems((prev) => [...prev, emptyLine()])
  const removeLine = (idx: number) => setLineItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)

  const subtotal = lineItems.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const taxTotal = lineItems.reduce((sum, l) => sum + l.taxAmount, 0)
  const total = subtotal + taxTotal

  const handleFileDrop = (e: React.DragEvent) => { e.preventDefault(); setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]) }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]) }

  const currencyList = currencies.length > 0
    ? currencies.map(c => ({ 
        code: c.code, 
        name: c.name.startsWith(c.code) ? c.name : `${c.code} ${c.name}` 
      }))
    : [
        { code: "INR", name: "INR Indian rupee" },
        { code: "USD", name: "USD US dollar" },
        { code: "EUR", name: "EUR Euro" },
        { code: "GBP", name: "GBP British pound" },
        { code: "AED", name: "AED UAE dirham" },
        { code: "SGD", name: "SGD Singapore dollar" },
        { code: "AUD", name: "AUD Australian dollar" },
        { code: "CAD", name: "CAD Canadian dollar" },
      ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (<Button><Plus className="h-4 w-4" /> New {formLabelLower}</Button>)}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-5xl flex flex-col gap-0 p-0 overflow-hidden border border-border shadow-2xl rounded-2xl"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <SheetHeader className="px-8 pt-8 pb-6 shrink-0 bg-muted/5 border-b border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="p-2 bg-primary/10 rounded-md"><FileText className="h-5 w-5 text-primary" /></div>
                <SheetTitle className="text-xl font-bold tracking-tight">
                  {managedId ? (loadingManaged ? "Loading..." : managedData?.invoice ? `Edit ${managedData.invoice.type === 'estimate' ? 'Estimate' : 'Invoice'} #${managedData.invoice.invoiceNumber}` : "Updating...") : `New ${formLabelLower}`}
                </SheetTitle>
              </div>

              {managedId && (
                <div className="flex-1 flex justify-center">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </div>
              )}
              
              <div className="min-w-[100px]" />
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden relative">
            {managedId && loadingManaged ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Getting your document ready...</p>
              </div>
            ) : managedId && managedData ? (
              <>
                <TabsContent value="details" className="h-full m-0 p-0 overflow-y-auto focus-visible:ring-0">
                  <div className="px-8 py-8">
                    <EditInvoiceForm 
                      invoice={managedData.invoice} 
                      files={managedData.files} 
                      baseCurrency={baseCurrency} 
                      isSheet={true}
                      onClose={() => setOpen(false)}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      org={managedData.org}
                      invoiceSettings={managedData.invoiceSettings}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="h-full m-0 p-0 focus-visible:ring-0">
                  <EditInvoiceForm 
                    invoice={managedData.invoice} 
                    files={managedData.files} 
                    baseCurrency={baseCurrency} 
                    isSheet={true}
                    onClose={() => setOpen(false)}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onlyPreview={true}
                    org={managedData.org}
                    invoiceSettings={managedData.invoiceSettings}
                  />
                </TabsContent>
              </>
            ) : (
              <div className="h-full overflow-y-auto px-8 py-8">
                <form
                  id="new-invoice-form"
                  action={(formData) => {
              const validItems = lineItems.filter(l => l.name.trim() !== "" || l.itemId !== "");
              if (validItems.length === 0) {
                return; // Prevent submission of empty invoices
              }
              // Manually append files since the input is hidden
              files.forEach(file => formData.append("files", file));
              formAction(formData);
            }}
            className="flex flex-col gap-8"
          >
            {/* Client Section */}
            <div className="space-y-4">
              <ContactPicker onSelect={handleContactSelect} defaultName={defaultClientName} defaultContactId={defaultContactId} type="client" />
              <input type="hidden" name="clientName" value={clientName} />
              <input type="hidden" name="clientEmail" value={clientEmail} />
              <input type="hidden" name="clientTaxId" value={clientTaxId || taxId} />
              <input type="hidden" name="clientAddress" value={clientAddress} />
              <input type="hidden" name="subject" value={subject} />
              <input type="hidden" name="description" value={description} />

              {hasSelectedContact ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1">
                  <p className="text-sm font-bold text-foreground">{clientName}</p>
                  {clientEmail && <p className="text-xs text-muted-foreground">{clientEmail}</p>}
                  {(clientTaxId || taxId) && <p className="text-xs text-muted-foreground font-mono uppercase tracking-tighter">Tax ID: {clientTaxId || taxId}</p>}
                  {clientAddress && <p className="text-xs text-muted-foreground leading-relaxed">{clientAddress}</p>}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Client name *</Label>
                    <Input placeholder="Enter client name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input type="email" placeholder="client@email.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm font-medium">Tax ID</Label>
                      <Input placeholder="Optional" value={clientTaxId} onChange={(e) => setClientTaxId(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">Type</Label>
                  <Select name="type" defaultValue={defaultType}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales invoice</SelectItem>
                      <SelectItem value="purchase">Purchase invoice</SelectItem>
                      <SelectItem value="estimate">Estimate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <FormSelectCurrency
                    title="Currency"
                    name="currency"
                    defaultValue={baseCurrency}
                    currencies={currencyList}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">Issue date</Label>
                  <DatePicker name="issuedAt" defaultValue={today} placeholder="Issue date" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">Due date</Label>
                  <DatePicker name="dueAt" defaultValue={defaultDueDate} placeholder="Due date" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Subject</Label>
                <Input placeholder="e.g. Project Delivery - Q1" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea placeholder="Detailed explanation..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
            </div>

            {/* Line Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                <span className="text-sm font-bold text-foreground">Line items</span>
                <Button type="button" variant="ghost" size="sm" onClick={addLine} className="h-7 text-[10px] font-bold uppercase tracking-tight text-primary"><Plus className="h-3.5 w-3.5 mr-1" /> Add item</Button>
              </div>
              <div className="space-y-3">
                {lineItems.map((line, idx) => (
                  <div key={idx} className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3 relative overflow-hidden">
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)} className="absolute top-3 right-3 text-muted-foreground/40 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium">Item</Label>
                        {settingsItems.length > 0 ? (
                          <Select value={line.itemId || "custom"} onValueChange={(v) => updateLine(idx, "itemId", v === "custom" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs font-medium"><SelectValue placeholder="Select item" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Custom item</SelectItem>
                              {settingsItems.map((item) => (<SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input className="h-8 text-xs font-medium" placeholder="Item name" value={line.name} onChange={(e) => updateLine(idx, "name", e.target.value)} />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium">Description</Label>
                        <Input className="h-8 text-xs font-medium" placeholder="Optional" value={line.description} onChange={(e) => updateLine(idx, "description", e.target.value)} />
                      </div>
                    </div>
                    {!line.itemId && settingsItems.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium">Custom name</Label>
                        <Input className="h-8 text-xs font-medium" placeholder="Item name" value={line.name} onChange={(e) => updateLine(idx, "name", e.target.value)} />
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium">Qty</Label>
                        <Input className="h-8 text-xs font-medium" type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium">Price</Label>
                        <Input className="h-8 text-xs font-medium" type="number" step="0.01" value={(line.price / 100)} onChange={(e) => updateLine(idx, "price", Math.round(parseFloat(e.target.value || "0") * 100))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium">Tax</Label>
                        <Select value={line.taxId || "none"} onValueChange={(v) => updateLine(idx, "taxId", v === "none" ? "" : v)}>
                          <SelectTrigger className="h-8 text-xs font-medium"><SelectValue placeholder="None" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {settingsTaxes.map((tax) => (<SelectItem key={tax.id} value={tax.id}>{tax.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium" >Total</Label>
                        <div className="h-8 flex items-center text-xs font-bold tabular-nums">{(line.total / 100).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <div className="w-1/2 space-y-1.5 text-xs font-medium">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono tabular-nums">{(subtotal / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="font-mono tabular-nums">{(taxTotal / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border/60 pt-1.5"><span>Total</span><span className="font-mono tabular-nums text-sm">{(total / 100).toFixed(2)}</span></div>
                </div>
              </div>
              <input type="hidden" name="subtotal" value={(subtotal / 100).toFixed(2)} />
              <input type="hidden" name="taxTotal" value={(taxTotal / 100).toFixed(2)} />
              <input type="hidden" name="total" value={(total / 100).toFixed(2)} />
              <input type="hidden" name="itemsJson" value={JSON.stringify(lineItems.filter(l => l.name.trim() !== "" || l.itemId !== ""))} />
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
              <span className="text-sm font-bold text-foreground block border-b border-border/40 pb-2">Attachments</span>
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}
                className="border-2 border-dashed border-border/60 bg-muted/5 rounded-xl p-6 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer group"
                onClick={() => document.getElementById("inv-file-input")?.click()}>
                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-semibold text-foreground">Click to upload or drag and drop</p>
                <p className="text-[11px] text-muted-foreground mt-1">PDF, images or spreadsheets</p>
                <input id="inv-file-input" name="files" type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx" />
              </div>
              {files.length > 0 && (
                <div className="grid gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-muted/30 border border-border/40 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{f.name}</span>
                      </div>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground/60 hover:text-destructive transition-colors shrink-0"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <span className="text-sm font-bold text-foreground block border-b border-border/40 pb-2">Notes & Terms</span>
              <Textarea name="notes" className="px-3 pt-3 resize-none focus:bg-background" defaultValue={invoiceSettings.invoice_notes || ""} placeholder="Payment instructions, late fees, etc…" rows={3} />
            </div>

            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-semibold">{state.error}</div>
            )}
            </form>
          </div>
        )}
      </div>

          <SheetFooter className="px-6 py-4 border-t flex-row items-center gap-2 shrink-0 bg-background text-foreground">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="px-4"
          >
            Cancel
          </Button>
          <div className="flex-1" />
          
          {managedId ? (
            <>
              <Button 
                type="submit"
                form="edit-invoice-form"
                name="intent"
                value="send"
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 hover:text-primary"
              >
                Send to client
              </Button>
              <Button 
                form="edit-invoice-form"
                type="submit" 
                className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/10"
              >
                Save changes
              </Button>
            </>
          ) : (
            <Button 
              form="new-invoice-form"
              type="submit" 
              disabled={pending} 
              className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/10"
            >
              {pending ? `Creating ${formLabel}...` : `Create ${formLabel}`}
            </Button>
          )}
        </SheetFooter>
      </Tabs>
      </SheetContent>
    </Sheet>
  )
}

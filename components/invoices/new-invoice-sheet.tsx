"use client"

import { ContactPicker } from "@/components/contacts/contact-picker"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
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
import { FileText, Plus, Trash2, Upload } from "lucide-react"
import { useActionState, useCallback, useState } from "react"
import { createInvoiceAction } from "@/app/(app)/invoices/actions"

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
  defaultContactId?: string
  defaultClientName?: string
  baseCurrency?: string
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
  defaultContactId = "",
  defaultClientName = "",
  baseCurrency = "INR",
  defaultType = "sales",
  invoiceSettings = {},
  currencies = [],
  items: settingsItems = [],
  taxes: settingsTaxes = [],
}: NewInvoiceSheetProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createInvoiceAction, null)

  const paymentTermsDays = parseInt(invoiceSettings.invoice_payment_terms || "30") || 30
  const today = new Date().toISOString().split("T")[0]
  const defaultDueDate = new Date(Date.now() + paymentTermsDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const [clientName, setClientName] = useState(defaultClientName)
  const [clientEmail, setClientEmail] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientTaxId, setClientTaxId] = useState("")
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
    ? currencies
    : [{ code: "INR", name: "INR" }, { code: "USD", name: "USD" }, { code: "EUR", name: "EUR" }, { code: "GBP", name: "GBP" }, { code: "AED", name: "AED" }]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (<Button><Plus className="h-4 w-4" /> New invoice</Button>)}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden border-border shadow-2xl"
      >
        <SheetHeader className="px-8 pt-8 pb-6 shrink-0 bg-muted/5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md"><FileText className="h-5 w-5 text-primary" /></div>
            <SheetTitle className="text-xl font-bold tracking-tight">New invoice</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <form
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
            {/* Client */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Client</h4>
              <ContactPicker onSelect={handleContactSelect} defaultName={defaultClientName} defaultContactId={defaultContactId} type="client" />
              <input type="hidden" name="clientName" value={clientName} />
              <input type="hidden" name="clientEmail" value={clientEmail} />
              <input type="hidden" name="clientTaxId" value={clientTaxId} />
              <input type="hidden" name="clientAddress" value={clientAddress} />

              {hasSelectedContact ? (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                  <p className="text-sm font-semibold">{clientName}</p>
                  {clientEmail && <p className="text-xs text-muted-foreground">{clientEmail}</p>}
                  {clientTaxId && <p className="text-xs text-muted-foreground">Tax ID: {clientTaxId}</p>}
                  {clientAddress && <p className="text-xs text-muted-foreground">{clientAddress}</p>}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold">Client name *</Label>
                    <Input placeholder="Enter client name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-semibold">Email</Label>
                      <Input type="email" placeholder="client@email.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-semibold">Tax ID</Label>
                      <Input placeholder="Optional" value={clientTaxId} onChange={(e) => setClientTaxId(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold">Type</Label>
                  <Select name="type" defaultValue={defaultType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales invoice</SelectItem>
                      <SelectItem value="purchase">Purchase invoice</SelectItem>
                      <SelectItem value="estimate">Estimate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold">Currency</Label>
                  <Select name="currency" defaultValue={baseCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencyList.map((c) => (<SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold">Issue date</Label>
                  <DatePicker name="issuedAt" defaultValue={today} placeholder="Issue date" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold">Due date</Label>
                  <DatePicker name="dueAt" defaultValue={defaultDueDate} placeholder="Due date" />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Line items</h4>
                <Button type="button" variant="secondary" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" /> Add item</Button>
              </div>
              <div className="space-y-3">
                {lineItems.map((line, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 space-y-3 relative">
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">Item</Label>
                        {settingsItems.length > 0 ? (
                          <Select value={line.itemId || "custom"} onValueChange={(v) => updateLine(idx, "itemId", v === "custom" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select item" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Custom item</SelectItem>
                              {settingsItems.map((item) => (<SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input className="h-8 text-xs" placeholder="Item name" value={line.name} onChange={(e) => updateLine(idx, "name", e.target.value)} />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">Description</Label>
                        <Input className="h-8 text-xs" placeholder="Optional" value={line.description} onChange={(e) => updateLine(idx, "description", e.target.value)} />
                      </div>
                    </div>
                    {!line.itemId && settingsItems.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">Custom name</Label>
                        <Input className="h-8 text-xs" placeholder="Item name" value={line.name} onChange={(e) => updateLine(idx, "name", e.target.value)} />
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">Qty</Label>
                        <Input className="h-8 text-xs" type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">Price</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={(line.price / 100).toFixed(2)} onChange={(e) => updateLine(idx, "price", Math.round(parseFloat(e.target.value || "0") * 100))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">Tax</Label>
                        <Select value={line.taxId || "none"} onValueChange={(v) => updateLine(idx, "taxId", v === "none" ? "" : v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {settingsTaxes.map((tax) => (<SelectItem key={tax.id} value={tax.id}>{tax.name} ({tax.rate}%)</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">Total</Label>
                        <div className="h-8 flex items-center text-xs font-semibold tabular-nums">{(line.total / 100).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <div className="w-1/2 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{(subtotal / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-mono">{(taxTotal / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="font-mono">{(total / 100).toFixed(2)}</span></div>
                </div>
              </div>
              <input type="hidden" name="subtotal" value={(subtotal / 100).toFixed(2)} />
              <input type="hidden" name="taxTotal" value={(taxTotal / 100).toFixed(2)} />
              <input type="hidden" name="total" value={(total / 100).toFixed(2)} />
              <input type="hidden" name="itemsJson" value={JSON.stringify(lineItems.filter(l => l.name.trim() !== "" || l.itemId !== ""))} />
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Attachments</h4>
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => document.getElementById("inv-file-input")?.click()}>
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, images, or documents</p>
                <input id="inv-file-input" name="files" type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx" />
              </div>
              {files.length > 0 && (
                <div className="space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded px-3 py-1.5">
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Notes</h4>
              <Textarea name="notes" defaultValue={invoiceSettings.invoice_notes || ""} placeholder="Payment terms, notes…" rows={3} />
            </div>

            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{state.error}</div>
            )}

            <div className="pt-2 sticky bottom-0 bg-background">
              <Button type="submit" disabled={pending} className="w-full h-12 text-md font-semibold shadow-lg shadow-primary/20 text-white leading-none">
                {pending ? "Creating..." : "Create invoice"}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { ContactPicker } from "@/components/contacts/contact-picker"
import { FormDate, FormInput, FormSelect, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Loader2, Send, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useActionState, useState, useTransition, useEffect } from "react"
import { updateInvoiceAction, generateAndAttachInvoicePDFAction, sendInvoiceAction } from "../actions"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// PDFPreview — lazy loaded to avoid SSR issues with @react-pdf/renderer
const PDFPreview = dynamic(() => import("@/components/invoices/pdf-preview"), { ssr: false, loading: () => (
  <div className="h-full flex items-center justify-center bg-muted/5">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
)})

function formatDate(date: Date | string | null | undefined) {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export function EditInvoiceForm({
  invoice,
  files,
  baseCurrency,
  isSheet = false,
  onClose,
  activeTab,
  setActiveTab,
  onlyPreview = false,
  org,
  invoiceSettings,
}: {
  invoice: any
  files: any[]
  baseCurrency: string
  isSheet?: boolean
  onClose?: () => void
  activeTab?: string
  setActiveTab?: (tab: string) => void
  onlyPreview?: boolean
  org?: any
  invoiceSettings?: any
}) {
  const [state, formAction, pending] = useActionState(updateInvoiceAction, null)
  const [isGenerating, startGenerating] = useTransition()
  const [isSending, startSending] = useTransition()
  const [previewFileId, setPreviewFileId] = useState<string | null>(
    files.find(f => f.mimetype === "application/pdf")?.id || (files.length > 0 ? files[0].id : null)
  )

  const [clientName, setClientName] = useState(invoice.clientName || "")
  const [clientEmail, setClientEmail] = useState(invoice.clientEmail || "")
  const [clientAddress, setClientAddress] = useState(invoice.clientAddress || "")
  const [clientTaxId, setClientTaxId] = useState(invoice.clientTaxId || "")
  const [contactId, setContactId] = useState(invoice.contactId || "")
  const [currency, setCurrency] = useState(invoice.currency || baseCurrency)

  function handleContactSelect(contact: any) {
    if (!contact) {
      setClientName("")
      setClientEmail("")
      setClientAddress("")
      setClientTaxId("")
      setContactId("")
      setCurrency(baseCurrency)
      return
    }
    setClientName(contact.name)
    setClientEmail(contact.email ?? "")
    setClientTaxId(contact.taxId ?? "")
    setClientAddress([contact.address, contact.city, contact.country].filter(Boolean).join(", "))
    setContactId(contact.id || "")
    
    // Auto-assign currency from the contact's preference
    if (contact.currency) {
      setCurrency(contact.currency)
    }
  }

  async function handleGeneratePdf() {
    startGenerating(async () => {
      const result = await generateAndAttachInvoicePDFAction(invoice.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("PDF generated and attached")
        if (result.fileId) {
          setPreviewFileId(result.fileId)
          if (setActiveTab) setActiveTab("preview")
        }
      }
    })
  }

  async function handleSendInvoice() {
    startSending(async () => {
      const result = await sendInvoiceAction(invoice.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Invoice sent to client")
      }
    })
  }

  const backUrl = invoice.type === "estimate" ? "/estimates" : "/invoices"

  if (onlyPreview) {
    // Build live formData for PDF render using current settings
    const liveFormData = org && invoiceSettings ? {
      title: invoiceSettings.invoice_title || "INVOICE",
      businessLogo: org.logo || null,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.issuedAt ? new Date(invoice.issuedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      dueDate: invoice.dueAt ? new Date(invoice.dueAt).toISOString().split("T")[0] : "",
      currency: invoice.currency || org.baseCurrency || "INR",
      companyDetails: `${org.name}\n${org.address || ""}${invoiceSettings.invoice_tax_id ? `\nTax ID: ${invoiceSettings.invoice_tax_id}` : ""}`,
      companyDetailsLabel: "Bill From",
      billTo: [invoice.clientName, invoice.clientEmail, invoice.clientAddress, invoice.clientTaxId ? `Tax ID: ${invoice.clientTaxId}` : ""].filter(Boolean).join("\n"),
      billToLabel: "Bill To",
      items: (invoice.items || []).length > 0
        ? (invoice.items || []).map((item: any) => ({
            name: item.name || "",
            subtitle: item.description || "",
            showSubtitle: !!item.description,
            quantity: item.quantity || 1,
            unitPrice: (item.price || 0) / 100,
            subtotal: ((item.price || 0) * (item.quantity || 1)) / 100,
          }))
        : [{ name: "Services", subtitle: "", showSubtitle: false, quantity: 1, unitPrice: invoice.subtotal / 100, subtotal: invoice.subtotal / 100 }],
      taxIncluded: false,
      additionalTaxes: invoice.taxTotal > 0 ? [{ name: "Tax", rate: 0, amount: invoice.taxTotal / 100 }] : [],
      additionalFees: [],
      notes: invoice.notes || invoiceSettings.invoice_notes || "",
      bankDetails: invoiceSettings.invoice_bank_details || org.bankDetails || "",
      issueDateLabel: "Issue Date",
      dueDateLabel: "Due Date",
      itemLabel: invoiceSettings.invoice_item_label || "Item",
      quantityLabel: invoiceSettings.invoice_quantity_label || "Qty",
      unitPriceLabel: invoiceSettings.invoice_price_label || "Unit Price",
      subtotalLabel: "Subtotal",
      summarySubtotalLabel: "Subtotal:",
      summaryTotalLabel: "Total:",
      accentColor: invoiceSettings.invoice_color || "#6366f1",
      template: invoiceSettings.invoice_template || "default",
      footerText: invoiceSettings.invoice_footer || "",
    } : null

    return (
      <div className="flex flex-col h-full relative border-t border-border/10" style={{ backgroundColor: "#f4f4f4" }}>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {previewFileId && (
            <a href={`/files/download/${previewFileId}`} target="_blank">
              <Button size="sm" variant="outline" className="h-8 text-[11px] bg-white/80 backdrop-blur-md shadow-sm font-bold px-3 border-border/60">
                <Download className="h-3.5 w-3.5 mr-2" />
                Download
              </Button>
            </a>
          )}
        </div>

        <div className="flex-1 overflow-hidden h-[calc(96vh-240px)]">
          {liveFormData ? (
            <PDFPreview data={liveFormData} />
          ) : previewFileId ? (
            <iframe
              src={`/files/preview/${previewFileId}#toolbar=0`}
              className="w-full h-full border-none"
              style={{ colorScheme: "light", backgroundColor: "white" }}
              title="File Preview"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-muted/5">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <div className="max-w-[240px]">
                <h3 className="text-sm font-bold mb-1">No Preview Available</h3>
                <p className="text-xs text-muted-foreground">Generate a PDF from the Details tab to see it here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Actions Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-1">
        <div className="flex flex-col">
          <span className="text-sm font-bold">Document Actions</span>
          <span className="text-xs text-muted-foreground italic">Manage and dispatch the generated PDF</span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
            disabled={isGenerating}
            onClick={handleGeneratePdf}
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-2" />
            )}
            {isGenerating ? "Generating..." : "Generate PDF"}
          </Button>
        </div>
      </div>

      <form id="edit-invoice-form" action={formAction} className="flex flex-col gap-8">
        <input type="hidden" name="invoiceId" value={invoice.id} />
        <input type="hidden" name="contactId" value={contactId} />
        <input type="hidden" name="clientName" value={clientName} />
        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormSelect
              name="type"
              title="Type"
              defaultValue={invoice.type || "sales"}
              items={[
                { code: "sales", name: "Sales invoice" },
                { code: "purchase", name: "Purchase invoice" },
                { code: "estimate", name: "Estimate" }
              ]}
            />
            <FormSelect
              name="status"
              title="Status"
              defaultValue={invoice.status || "draft"}
              items={[
                { code: "draft", name: "Draft" },
                { code: "sent", name: "Sent" },
                { code: "paid", name: "Paid" },
                { code: "overdue", name: "Overdue" },
                { code: "cancelled", name: "Cancelled" }
              ]}
            />
            <input type="hidden" name="currency" value={currency} />
            <FormSelect
              title="Currency"
              value={currency}
              onValueChange={setCurrency}
              items={[
                { code: "INR", name: "INR Indian rupee" },
                { code: "USD", name: "USD US dollar" },
                { code: "EUR", name: "EUR Euro" },
                { code: "GBP", name: "GBP British pound" },
                { code: "AED", name: "AED UAE dirham" },
                { code: "SGD", name: "SGD Singapore dollar" },
                { code: "AUD", name: "AUD Australian dollar" },
                { code: "CAD", name: "CAD Canadian dollar" },
              ]}
            />
          </div>

          <div className="space-y-4">
            <ContactPicker
              onSelect={handleContactSelect}
              defaultName={clientName}
              defaultContactId={contactId}
              type="client"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                name="clientEmail"
                title="Client email"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <FormInput
                name="clientTaxId"
                title="Tax ID (GSTIN)"
                placeholder="Optional"
                value={clientTaxId}
                onChange={(e) => setClientTaxId(e.target.value)}
              />
            </div>

            <FormTextarea
              name="clientAddress"
              title="Client address"
              placeholder="Street, City, State, PIN"
              value={clientAddress}
              rows={2}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormDate
              name="issuedAt"
              title="Issue date"
              defaultValue={invoice.issuedAt ? new Date(invoice.issuedAt) : undefined}
            />
            <FormDate
              name="dueAt"
              title="Due date"
              defaultValue={invoice.dueAt ? new Date(invoice.dueAt) : undefined}
            />
          </div>

          {/* Line items — read-only display */}
          {invoice.items && invoice.items.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Line items <span className="text-muted-foreground font-normal">({invoice.items.length})</span>
              </p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qty</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Price</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="px-3 py-2">
                          <span className="font-medium">{item.name || "Untitled"}</span>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.quantity ?? 1}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {((item.price ?? 0) / 100).toLocaleString("en", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          {((item.total ?? (item.price * item.quantity)) / 100).toLocaleString("en", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormInput
              name="subtotal"
              title="Subtotal"
              type="number"
              step="0.01"
              defaultValue={(invoice.subtotal / 100).toFixed(2)}
            />
            <FormInput
              name="taxTotal"
              title="Tax"
              type="number"
              step="0.01"
              defaultValue={(invoice.taxTotal / 100).toFixed(2)}
            />
            <FormInput
              name="total"
              title="Total *"
              type="number"
              step="0.01"
              defaultValue={(invoice.total / 100).toFixed(2)}
              isRequired
              className="font-bold text-primary"
            />
          </div>

          <FormTextarea
            name="notes"
            title="Notes"
            defaultValue={invoice.notes}
            placeholder="Payment terms, notes..."
            rows={3}
          />

          {state?.error && <p className="text-sm text-destructive font-medium px-1">{state.error}</p>}

          {state?.success && state?.message && (
             <p className="text-sm text-emerald-600 font-medium px-1">{state.message}</p>
          )}

          {!isSheet && (
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-4 z-10">
              <Link href={backUrl}>
                <Button type="button" variant="outline" className="h-11 px-6 border-border/60">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </Link>
              <Button type="submit" disabled={pending} className="flex-1 h-11 text-base font-bold shadow-lg shadow-primary/10">
                {pending ? "Saving changes..." : "Save changes"}
              </Button>
            </div>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium">Associated documents</span>
          <span className="text-xs text-muted-foreground">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer group",
                previewFileId === file.id ? "bg-primary/5 border-primary/30" : "bg-background border-border/40 hover:border-border/80"
              )}
              onClick={() => {
                setPreviewFileId(file.id)
                if (setActiveTab) setActiveTab("preview")
              }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">
                    {file.filename}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {(file.size / 1024).toFixed(1)} KB &middot; {file.mimetype.split("/")[1]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a 
                  href={`/files/download/${file.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-primary/10 hover:text-primary">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
          {files.length === 0 && (
            <div className="text-center py-10 rounded-lg border border-dashed border-border/60 bg-muted/5">
              <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">No documents attached.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

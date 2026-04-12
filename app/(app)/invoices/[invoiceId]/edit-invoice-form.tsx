"use client"

import { ContactPicker } from "@/components/contacts/contact-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, FileText, Loader2, Mail, Send, Check, Download } from "lucide-react"
import Link from "next/link"
import { useActionState, useState, useTransition } from "react"
import { updateInvoiceAction, generateAndAttachInvoicePDFAction, sendInvoiceAction } from "../actions"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

function formatDate(date: Date | string | null | undefined) {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export function EditInvoiceForm({
  invoice,
  files,
  baseCurrency,
}: {
  invoice: any
  files: any[]
  baseCurrency: string
}) {
  const [state, formAction, pending] = useActionState(updateInvoiceAction, null)
  const [isGenerating, startGenerating] = useTransition()
  const [isSending, startSending] = useTransition()

  const [clientName, setClientName] = useState(invoice.clientName || "")
  const [clientEmail, setClientEmail] = useState(invoice.clientEmail || "")
  const [clientAddress, setClientAddress] = useState(invoice.clientAddress || "")
  const [clientTaxId, setClientTaxId] = useState(invoice.clientTaxId || "")
  const [contactId, setContactId] = useState(invoice.contactId || "")

  function handleContactSelect(contact: any) {
    if (!contact) {
      setClientName("")
      setClientEmail("")
      setClientAddress("")
      setClientTaxId("")
      setContactId("")
      return
    }
    setClientName(contact.name)
    setClientEmail(contact.email ?? "")
    setClientTaxId(contact.taxId ?? "")
    setClientAddress([contact.address, contact.city, contact.country].filter(Boolean).join(", "))
    setContactId(contact.id || "")
  }

  async function handleGeneratePdf() {
    startGenerating(async () => {
      const result = await generateAndAttachInvoicePDFAction(invoice.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("PDF generated and attached")
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

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Actions Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Quick actions</span>
            <span className="text-xs text-muted-foreground">Generate documents or notify client</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={handleGeneratePdf}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2 text-primary" />
              )}
              {isGenerating ? "Generating..." : "Generate PDF"}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isSending}
              onClick={handleSendInvoice}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSending ? "Sending..." : "Send to client"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <input type="hidden" name="contactId" value={contactId} />
            <input type="hidden" name="clientName" value={clientName} />

            {/* Type + Status + Currency */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select name="type" defaultValue={invoice.type || "sales"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales invoice</SelectItem>
                    <SelectItem value="purchase">Purchase invoice</SelectItem>
                    <SelectItem value="estimate">Estimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={invoice.status || "draft"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Select name="currency" defaultValue={invoice.currency || baseCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact picker */}
            <ContactPicker
              onSelect={handleContactSelect}
              defaultName={clientName}
              defaultContactId={contactId}
            />

            {/* Client details */}
            <div className="flex flex-col gap-2">
              <Label>Client name</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Mindtris"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Client email</Label>
                <Input
                  name="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="akshitha@mindtris.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tax ID (GSTIN)</Label>
                <Input
                  name="clientTaxId"
                  value={clientTaxId}
                  onChange={(e) => setClientTaxId(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Client address</Label>
              <Textarea
                name="clientAddress"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Street, City, State, PIN"
                rows={2}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Issue date</Label>
                <Input name="issuedAt" type="date" defaultValue={formatDate(invoice.issuedAt)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Due date</Label>
                <Input name="dueAt" type="date" defaultValue={formatDate(invoice.dueAt)} />
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Subtotal</Label>
                <Input
                  name="subtotal"
                  type="number"
                  step="0.01"
                  defaultValue={(invoice.subtotal / 100).toFixed(2)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tax</Label>
                <Input
                  name="taxTotal"
                  type="number"
                  step="0.01"
                  defaultValue={(invoice.taxTotal / 100).toFixed(2)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Total *</Label>
                <Input
                  name="total"
                  type="number"
                  step="0.01"
                  defaultValue={(invoice.total / 100).toFixed(2)}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea
                name="notes"
                defaultValue={invoice.notes || ""}
                placeholder="Payment terms, notes..."
                rows={3}
              />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <div className="flex gap-3">
              <Link href={backUrl}>
                <Button type="button" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </Link>
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? "Updating..." : "Update invoice"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Associated documents
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
              <p className="text-sm text-muted-foreground">No documents attached to this invoice.</p>
              <Button
                variant="link"
                size="sm"
                className="mt-1"
                disabled={isGenerating}
                onClick={handleGeneratePdf}
              >
                Click to generate PDF
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y border rounded-lg overflow-hidden">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">
                        {file.filename}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {(file.size / 1024).toFixed(1)} KB &middot; {file.mimetype.split("/")[1]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/api/files/${file.id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

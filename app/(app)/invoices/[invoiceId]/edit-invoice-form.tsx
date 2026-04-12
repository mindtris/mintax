"use client"

import { ContactPicker } from "@/components/contacts/contact-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useActionState, useState } from "react"
import { updateInvoiceAction } from "../actions"

function formatDate(date: Date | string | null | undefined) {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export function EditInvoiceForm({ invoice, baseCurrency }: { invoice: any; baseCurrency: string }) {
  const [state, formAction, pending] = useActionState(updateInvoiceAction, null)

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

  const backUrl = invoice.type === "estimate" ? "/estimates" : "/invoices"

  return (
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input name="subtotal" type="number" step="0.01" defaultValue={(invoice.subtotal / 100).toFixed(2)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tax</Label>
              <Input name="taxTotal" type="number" step="0.01" defaultValue={(invoice.taxTotal / 100).toFixed(2)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Total *</Label>
              <Input name="total" type="number" step="0.01" defaultValue={(invoice.total / 100).toFixed(2)} required />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label>Notes</Label>
            <Textarea name="notes" defaultValue={invoice.notes || ""} placeholder="Payment terms, notes..." rows={3} />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

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
  )
}

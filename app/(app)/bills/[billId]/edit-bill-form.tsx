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
import { updateBillAction } from "../actions"

function formatDate(date: Date | string | null | undefined) {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export function EditBillForm({ bill, baseCurrency }: { bill: any; baseCurrency: string }) {
  const [state, formAction, pending] = useActionState(updateBillAction, null)

  const [vendorName, setVendorName] = useState(bill.vendorName || "")
  const [vendorEmail, setVendorEmail] = useState(bill.vendorEmail || "")
  const [vendorAddress, setVendorAddress] = useState(bill.vendorAddress || "")
  const [vendorTaxId, setVendorTaxId] = useState(bill.vendorTaxId || "")
  const [contactId, setContactId] = useState(bill.contactId || "")

  function handleContactSelect(contact: any) {
    if (!contact) {
      setVendorName("")
      setVendorEmail("")
      setVendorAddress("")
      setVendorTaxId("")
      setContactId("")
      return
    }
    setVendorName(contact.name)
    setVendorEmail(contact.email ?? "")
    setVendorTaxId(contact.taxId ?? "")
    setVendorAddress([contact.address, contact.city, contact.country].filter(Boolean).join(", "))
    setContactId(contact.id || "")
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="billId" value={bill.id} />
          <input type="hidden" name="contactId" value={contactId} />
          <input type="hidden" name="vendorName" value={vendorName} />

          {/* Status + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={bill.status || "draft"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Currency</Label>
              <Select name="currency" defaultValue={bill.currency || baseCurrency}>
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
            defaultName={vendorName}
            defaultContactId={contactId}
          />

          {/* Vendor details */}
          <div className="flex flex-col gap-2">
            <Label>Vendor name</Label>
            <Input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Vendor name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Vendor email</Label>
              <Input
                name="vendorEmail"
                type="email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tax ID (GSTIN)</Label>
              <Input
                name="vendorTaxId"
                value={vendorTaxId}
                onChange={(e) => setVendorTaxId(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vendor address</Label>
            <Textarea
              name="vendorAddress"
              value={vendorAddress}
              onChange={(e) => setVendorAddress(e.target.value)}
              placeholder="Street, City, State, PIN"
              rows={2}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Issue date</Label>
              <Input name="issuedAt" type="date" defaultValue={formatDate(bill.issuedAt)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Due date</Label>
              <Input name="dueAt" type="date" defaultValue={formatDate(bill.dueAt)} />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Subtotal</Label>
              <Input name="subtotal" type="number" step="0.01" defaultValue={(bill.subtotal / 100).toFixed(2)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tax</Label>
              <Input name="taxTotal" type="number" step="0.01" defaultValue={((bill.taxTotal || 0) / 100).toFixed(2)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Total *</Label>
              <Input name="total" type="number" step="0.01" defaultValue={(bill.total / 100).toFixed(2)} required />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label>Notes</Label>
            <Textarea name="notes" defaultValue={bill.notes || ""} placeholder="Payment terms, notes..." rows={3} />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex gap-3">
            <Link href="/bills">
              <Button type="button" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </Link>
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Updating..." : "Update bill"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

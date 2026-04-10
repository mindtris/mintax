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
import { Plus } from "lucide-react"
import { useActionState, useState } from "react"
import { createInvoiceAction } from "@/app/(app)/invoices/actions"

interface NewInvoiceSheetProps {
  children?: React.ReactNode
  defaultContactId?: string
  defaultClientName?: string
  baseCurrency?: string
  defaultType?: string
}

export function NewInvoiceSheet({
  children,
  defaultContactId = "",
  defaultClientName = "",
  baseCurrency = "INR",
  defaultType = "sales",
}: NewInvoiceSheetProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createInvoiceAction, null)

  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const [clientName, setClientName] = useState(defaultClientName)
  const [clientEmail, setClientEmail] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientTaxId, setClientTaxId] = useState("")

  function handleContactSelect(
    contact: {
      name: string
      email?: string | null
      taxId?: string | null
      address?: string | null
      city?: string | null
      country?: string | null
    } | null
  ) {
    if (!contact) {
      setClientName("")
      setClientEmail("")
      setClientAddress("")
      setClientTaxId("")
      return
    }
    setClientName(contact.name)
    setClientEmail(contact.email ?? "")
    setClientTaxId(contact.taxId ?? "")
    setClientAddress(
      [contact.address, contact.city, contact.country].filter(Boolean).join(", ")
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="h-4 w-4" />
            New invoice
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>New invoice</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form action={formAction} className="flex flex-col gap-4">
            {/* Type + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-type">Type</Label>
                <Select name="type" defaultValue={defaultType}>
                  <SelectTrigger id="inv-type">
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
                <Label htmlFor="inv-currency">Currency</Label>
                <Select name="currency" defaultValue={baseCurrency}>
                  <SelectTrigger id="inv-currency">
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
              defaultName={defaultClientName}
              defaultContactId={defaultContactId}
            />

            {/* Hidden contactId */}
            <input type="hidden" name="contactId" value={defaultContactId} />

            {/* Client name */}
            <input type="hidden" name="clientName" value={clientName} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-client-name">
                Client name{" "}
                <span className="text-muted-foreground font-normal">
                  (or type manually)
                </span>
              </Label>
              <Input
                id="inv-client-name"
                placeholder="Acme Corp"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            {/* Email + Tax ID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-client-email">Client email</Label>
                <Input
                  id="inv-client-email"
                  name="clientEmail"
                  type="email"
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-tax-id">Tax ID (GSTIN)</Label>
                <Input
                  id="inv-tax-id"
                  name="clientTaxId"
                  placeholder="Optional"
                  value={clientTaxId}
                  onChange={(e) => setClientTaxId(e.target.value)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-address">Client address</Label>
              <Textarea
                id="inv-address"
                name="clientAddress"
                placeholder="Street, City, State, PIN"
                rows={2}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-issued">Issue date</Label>
                <Input id="inv-issued" name="issuedAt" type="date" defaultValue={today} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-due">Due date</Label>
                <Input id="inv-due" name="dueAt" type="date" defaultValue={thirtyDaysLater} />
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-subtotal">Subtotal</Label>
                <Input id="inv-subtotal" name="subtotal" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-tax">Tax</Label>
                <Input id="inv-tax" name="taxTotal" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-total">Total *</Label>
                <Input id="inv-total" name="total" type="number" step="0.01" placeholder="0.00" required />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea id="inv-notes" name="notes" placeholder="Payment terms, notes…" rows={3} />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating…" : "Create invoice"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

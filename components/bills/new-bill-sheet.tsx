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
import { Plus, ReceiptText } from "lucide-react"
import { useActionState, useState } from "react"
import { createBillAction } from "@/app/(app)/bills/actions"

interface NewBillSheetProps {
  children?: React.ReactNode
  defaultVendorName?: string
  defaultContactId?: string
  baseCurrency?: string
  // Defaults passed from settings/parent
  defaultDueDays?: number
}

export function NewBillSheet({
  children,
  defaultVendorName = "",
  defaultContactId = "",
  baseCurrency = "INR",
  defaultDueDays = 30
}: NewBillSheetProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createBillAction, null)

  const today = new Date().toISOString().split("T")[0]
  const calculatedDueDate = new Date(Date.now() + defaultDueDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const [vendorName, setVendorName] = useState(defaultVendorName)
  const [vendorEmail, setVendorEmail] = useState("")
  const [vendorAddress, setVendorAddress] = useState("")
  const [vendorTaxId, setVendorTaxId] = useState("")

  function handleVendorSelect(
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
      setVendorName("")
      setVendorEmail("")
      setVendorAddress("")
      setVendorTaxId("")
      return
    }
    setVendorName(contact.name)
    setVendorEmail(contact.email || "")
    setVendorTaxId(contact.taxId || "")
    setVendorAddress(
      [contact.address, contact.city, contact.country].filter(Boolean).join(", ")
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="h-4 w-4" />
            <span>Record bill</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-auto max-h-[96vh] w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden border-black/[0.05] shadow-2xl"
      >
        <SheetHeader className="px-8 pt-8 pb-6 shrink-0 bg-muted/5 border-b border-black/[0.03]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <ReceiptText className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight">Record new bill</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <form action={formAction} className="flex flex-col gap-8">
            {/* Vendor Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Vendor information</h4>
              
              <ContactPicker
                onSelect={handleVendorSelect}
                defaultName={defaultVendorName}
                defaultContactId={defaultContactId}
                type="vendor"
              />

              <input type="hidden" name="contactId" value={defaultContactId} />
              <input type="hidden" name="vendorName" value={vendorName} />
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="bill-vendor-name" className="text-xs font-semibold">Vendor name (Manual entry)</Label>
                <Input
                  id="bill-vendor-name"
                  placeholder="ACME Supplies Ltd"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-vendor-email" className="text-xs font-semibold">Email</Label>
                  <Input
                    id="bill-vendor-email"
                    name="vendorEmail"
                    type="email"
                    placeholder="billing@vendor.com"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-tax-id" className="text-xs font-semibold">Tax ID</Label>
                  <Input
                    id="bill-tax-id"
                    name="vendorTaxId"
                    placeholder="Optional"
                    value={vendorTaxId}
                    onChange={(e) => setVendorTaxId(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="bill-address" className="text-xs font-semibold">Address</Label>
                <Textarea
                  id="bill-address"
                  name="vendorAddress"
                  placeholder="Street, City, ZIP"
                  rows={2}
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Financial details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-currency" className="text-xs font-semibold">Currency</Label>
                  <Select name="currency" defaultValue={baseCurrency}>
                    <SelectTrigger id="bill-currency" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-issued" className="text-xs font-semibold">Issue date</Label>
                  <Input id="bill-issued" name="issuedAt" type="date" defaultValue={today} className="h-11" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-due" className="text-xs font-semibold text-primary">Due date (Pre-populated)</Label>
                  <Input id="bill-due" name="dueAt" type="date" defaultValue={calculatedDueDate} className="h-11 border-primary/20 bg-primary/5" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-total" className="text-xs font-semibold">Total amount *</Label>
                  <Input id="bill-total" name="total" type="number" step="0.01" placeholder="0.00" required className="h-11" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-subtotal" className="text-xs font-semibold">Subtotal</Label>
                  <Input id="bill-subtotal" name="subtotal" type="number" step="0.01" placeholder="0.00" className="h-11" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-tax" className="text-xs font-semibold">Tax total</Label>
                  <Input id="bill-tax" name="taxTotal" type="number" step="0.01" placeholder="0.00" className="h-11" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4 pb-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Additional info</h4>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bill-notes" className="text-xs font-semibold">Audit notes</Label>
                <Textarea id="bill-notes" name="notes" placeholder="Reasons for payment, special instructions…" rows={3} />
              </div>
            </div>

            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">
                {state.error}
              </div>
            )}

            <div className="pt-2 sticky bottom-0 bg-white">
                <Button type="submit" disabled={pending} className="w-full h-12 text-md font-semibold shadow-lg shadow-primary/20 text-white leading-none">
                    {pending ? "Recording..." : "Record bill"}
                </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

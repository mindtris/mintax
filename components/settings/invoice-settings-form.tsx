"use client"

import { saveInvoiceSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { InvoiceTemplatePreview } from "@/components/settings/invoice-template-preview"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"

interface Props {
  settings: Record<string, string>
  orgName: string
}

export default function InvoiceSettingsForm({ settings, orgName }: Props) {
  const [saveState, saveAction, pending] = useActionState(saveInvoiceSettingsAction, null)
  const [selectedTemplate, setSelectedTemplate] = useState(settings.invoice_template || "default")
  const [accentColor, setAccentColor] = useState(settings.invoice_color || "#c96442")

  useEffect(() => {
    if (saveState?.success) toast.success("Invoice settings saved")
    if (saveState?.error) toast.error(saveState.error)
  }, [saveState])

  return (
    <form action={saveAction} className="space-y-10">
      {/* Template selection */}
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Template</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose the layout for your invoice documents.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(["default", "classic", "modern"] as const).map((tpl) => (
            <InvoiceTemplatePreview
              key={tpl}
              template={tpl}
              accentColor={accentColor}
              orgName={orgName}
              selected={selectedTemplate === tpl}
              onClick={() => setSelectedTemplate(tpl)}
            />
          ))}
        </div>
        <input type="hidden" name="invoice_template" value={selectedTemplate} />
      </section>

      <hr className="border-border" />

      {/* Numbering */}
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Numbering</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure how invoice numbers are generated.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice_number_prefix">Number prefix</Label>
            <Input
              id="invoice_number_prefix"
              name="invoice_number_prefix"
              defaultValue={settings.invoice_number_prefix || "INV"}
              placeholder="INV"
            />
            <p className="text-[10px] text-muted-foreground">e.g. INV, BILL, EST</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_number_digits">Number digits</Label>
            <Input
              id="invoice_number_digits"
              name="invoice_number_digits"
              type="number"
              min={1}
              max={10}
              defaultValue={settings.invoice_number_digits || "3"}
              placeholder="3"
            />
            <p className="text-[10px] text-muted-foreground">Zero-padded digits (3 = 001)</p>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Defaults */}
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Defaults</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pre-filled values when creating new invoices.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_payment_terms">Payment terms (days)</Label>
          <Input
            id="invoice_payment_terms"
            name="invoice_payment_terms"
            type="number"
            defaultValue={settings.invoice_payment_terms || "30"}
            placeholder="30"
          />
          <p className="text-[10px] text-muted-foreground">Default number of days until payment is due.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_title">Invoice title</Label>
          <Input
            id="invoice_title"
            name="invoice_title"
            defaultValue={settings.invoice_title || ""}
            placeholder="Invoice"
          />
          <p className="text-[10px] text-muted-foreground">Displayed at the top of the invoice document.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_subheading">Subheading</Label>
          <Input
            id="invoice_subheading"
            name="invoice_subheading"
            defaultValue={settings.invoice_subheading || ""}
            placeholder="Tax Invoice"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_notes">Default notes</Label>
          <Textarea
            id="invoice_notes"
            name="invoice_notes"
            defaultValue={settings.invoice_notes || ""}
            placeholder="Payment is due within the specified terms. Late payments may incur additional charges."
            rows={3}
          />
          <p className="text-[10px] text-muted-foreground">Pre-filled in the notes field of new invoices.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_footer">Default footer</Label>
          <Textarea
            id="invoice_footer"
            name="invoice_footer"
            defaultValue={settings.invoice_footer || ""}
            placeholder="Thank you for your business."
            rows={2}
          />
          <p className="text-[10px] text-muted-foreground">Shown at the bottom of the invoice document.</p>
        </div>

        <label className="flex items-center gap-3 py-2">
          <Checkbox
            name="invoice_auto_send"
            defaultChecked={settings.invoice_auto_send === "true"}
            value="true"
          />
          <div>
            <span className="text-sm font-medium">Auto-send on creation</span>
            <p className="text-[10px] text-muted-foreground">Automatically email the invoice to the client when created.</p>
          </div>
        </label>
      </section>

      <hr className="border-border" />

      {/* Appearance */}
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Appearance</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Customize the look of your invoices.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_color">Accent color</Label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className="block h-8 w-8 rounded-md border"
                style={{ backgroundColor: accentColor }}
              />
              <input
                type="color"
                name="invoice_color"
                className="absolute inset-0 h-8 w-8 opacity-0 cursor-pointer"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
            </div>
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#c96442"
              className="flex-1 max-w-[140px]"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">Updates the template preview in real time.</p>
        </div>
      </section>

      <hr className="border-border" />

      {/* Column labels */}
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Column labels</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Customize column headers on invoice documents.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice_item_label">Item column</Label>
            <Input
              id="invoice_item_label"
              name="invoice_item_label"
              defaultValue={settings.invoice_item_label || ""}
              placeholder="Item"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_price_label">Price column</Label>
            <Input
              id="invoice_price_label"
              name="invoice_price_label"
              defaultValue={settings.invoice_price_label || ""}
              placeholder="Price"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_quantity_label">Quantity column</Label>
            <Input
              id="invoice_quantity_label"
              name="invoice_quantity_label"
              defaultValue={settings.invoice_quantity_label || ""}
              placeholder="Qty"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 py-2">
          <Checkbox
            name="invoice_hide_item_description"
            defaultChecked={settings.invoice_hide_item_description === "true"}
            value="true"
          />
          <span className="text-sm font-medium">Hide item descriptions</span>
        </label>
      </section>

      <div className="pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save invoice settings"}
        </Button>
      </div>

      {saveState?.error && <FormError>{saveState.error}</FormError>}
    </form>
  )
}

"use client"

import { saveEstimateSettingsAction } from "@/app/(app)/settings/actions"
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

export default function EstimateSettingsForm({ settings, orgName }: Props) {
  const [saveState, saveAction, pending] = useActionState(saveEstimateSettingsAction, null)
  const [selectedTemplate, setSelectedTemplate] = useState(settings.estimate_template || "default")
  const [accentColor, setAccentColor] = useState(settings.estimate_color || "#c96442")

  useEffect(() => {
    if (saveState?.success) toast.success("Estimate settings saved")
    if (saveState?.error) toast.error(saveState.error)
  }, [saveState])

  return (
    <form action={saveAction} className="space-y-10">
      {/* Template selection */}
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Template</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose the layout for your estimate documents.
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
        <input type="hidden" name="estimate_template" value={selectedTemplate} />
      </section>

      <hr className="border-border" />

      {/* Numbering */}
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Numbering</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure how estimate numbers are generated.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimate_number_prefix">Number prefix</Label>
            <Input
              id="estimate_number_prefix"
              name="estimate_number_prefix"
              defaultValue={settings.estimate_number_prefix || "EST"}
              placeholder="EST"
            />
            <p className="text-[10px] text-muted-foreground">e.g. EST, QUO, PROP</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimate_number_digits">Number digits</Label>
            <Input
              id="estimate_number_digits"
              name="estimate_number_digits"
              type="number"
              min={1}
              max={10}
              defaultValue={settings.estimate_number_digits || "3"}
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
            Pre-filled values when creating new estimates.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimate_validity_days">Validity period (days)</Label>
          <Input
            id="estimate_validity_days"
            name="estimate_validity_days"
            type="number"
            defaultValue={settings.estimate_validity_days || "30"}
            placeholder="30"
          />
          <p className="text-[10px] text-muted-foreground">How long the estimate remains valid.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimate_title">Estimate title</Label>
          <Input
            id="estimate_title"
            name="estimate_title"
            defaultValue={settings.estimate_title || ""}
            placeholder="Estimate"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimate_subheading">Subheading</Label>
          <Input
            id="estimate_subheading"
            name="estimate_subheading"
            defaultValue={settings.estimate_subheading || ""}
            placeholder="Quotation / Proposal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimate_notes">Default notes</Label>
          <Textarea
            id="estimate_notes"
            name="estimate_notes"
            defaultValue={settings.estimate_notes || ""}
            placeholder="This estimate is valid for 30 days. Prices are subject to change after the validity period."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimate_footer">Default footer</Label>
          <Textarea
            id="estimate_footer"
            name="estimate_footer"
            defaultValue={settings.estimate_footer || ""}
            placeholder="Thank you for considering our services."
            rows={2}
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* Appearance */}
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Appearance</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Customize the look of your estimates.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimate_color">Accent color</Label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="block h-8 w-8 rounded-md border" style={{ backgroundColor: accentColor }} />
              <input
                type="color"
                name="estimate_color"
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
            Customize column headers on estimate documents.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimate_item_label">Item column</Label>
            <Input id="estimate_item_label" name="estimate_item_label" defaultValue={settings.estimate_item_label || ""} placeholder="Item" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimate_price_label">Price column</Label>
            <Input id="estimate_price_label" name="estimate_price_label" defaultValue={settings.estimate_price_label || ""} placeholder="Price" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimate_quantity_label">Quantity column</Label>
            <Input id="estimate_quantity_label" name="estimate_quantity_label" defaultValue={settings.estimate_quantity_label || ""} placeholder="Qty" />
          </div>
        </div>

        <label className="flex items-center gap-3 py-2">
          <Checkbox name="estimate_hide_item_description" defaultChecked={settings.estimate_hide_item_description === "true"} value="true" />
          <span className="text-sm font-medium">Hide item descriptions</span>
        </label>
      </section>

      <div className="pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save estimate settings"}
        </Button>
      </div>

      {saveState?.error && <FormError>{saveState.error}</FormError>}
    </form>
  )
}

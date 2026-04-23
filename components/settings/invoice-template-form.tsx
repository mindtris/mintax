"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { InvoiceFormData } from "@/app/(app)/apps/invoices/components/invoice-page"
import { FormAvatar, FormInput, FormTextarea, FormSelect } from "@/components/forms/simple"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { Currency, Organization, User } from "@/lib/prisma/client"
import { SettingsMap } from "@/lib/services/settings"
import { updateTemplateAction, addNewTemplateAction } from "@/app/(app)/apps/invoices/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import defaultTemplates from "@/app/(app)/apps/invoices/default-templates"

interface Props {
  user: User
  org: Organization
  settings: SettingsMap
  currencies: Currency[]
  initialData?: any
  onSave?: () => void
  type: "invoice" | "estimate"
}

export interface InvoiceFormHandle {
  save: () => Promise<void>
}

const ACCENT_COLORS = [
  { name: "Midnight Indigo", value: "#6366f1" },
  { name: "Steel Slate", value: "#475569" },
  { name: "Forest Emerald", value: "#10b981" },
  { name: "Rose Ruby", value: "#f43f5e" },
  { name: "Golden Amber", value: "#f59e0b" },
  { name: "Deep Ocean", value: "#0ea5e9" },
  { name: "Royal Violet", value: "#8b5cf6" },
  { name: "Charcoal Black", value: "#18181b" },
]

const TEMPLATE_STYLES = [
  { code: "default", name: "Modern" },
  { code: "minimal", name: "Minimalist" },
  { code: "compact", name: "Compact" },
]

const InvoiceTemplateForm = forwardRef<InvoiceFormHandle, Props>(({
  user,
  org,
  settings,
  currencies,
  initialData,
  onSave,
  type
}, ref) => {
  const router = useRouter()
  const [templateName, setTemplateName] = useState(initialData?.name || "")
  const [formData, setFormData] = useState<InvoiceFormData>(() => {
    if (initialData?.formData) return initialData.formData
    if (initialData) return initialData // Fallback for raw data
    // New template default
    return defaultTemplates(org, settings, user.email || "")[0].formData
  })
  const [isSaving, setIsSaving] = useState(false)

  useImperativeHandle(ref, () => ({
    save: handleSave
  }))

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Template name is required")
      return
    }

    setIsSaving(true)
    try {
      let result
      if (initialData?.id && !initialData.id.startsWith("default_")) {
        result = await updateTemplateAction(org.id, initialData.id, {
          formData: formData,
        })
      } else {
        result = await addNewTemplateAction(org.id, {
          id: `tmpl_${Math.random().toString(36).substring(2, 15)}`,
          name: templateName,
          formData: formData,
        })
      }

      if (result?.success) {
        toast.success("Template saved")
        onSave?.()
        router.refresh()
      } else {
        toast.error("Failed to save template")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col gap-10 px-6 py-8 pb-24">
      {/* ─── Branding & Identity Section ──────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold text-foreground">Identity & Branding</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormInput
              title="Template reference name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Modern Professional"
              isRequired
            />
            <FormSelect
              title="Visual template style"
              value={formData.template || "default"}
              onValueChange={(v) => updateField("template", v)}
              items={TEMPLATE_STYLES}
            />
            <FormSelect
              title="Tax strategy"
              value={formData.taxIncluded ? "inclusive" : "exclusive"}
              onValueChange={(v) => updateField("taxIncluded", v === "inclusive")}
              items={[
                { code: "exclusive", name: "Tax Exclusive (Added on top)" },
                { code: "inclusive", name: "Tax Inclusive (Hidden in price)" }
              ]}
            />
          </div>
          <div className="flex flex-col gap-3">
             <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Accent branding color</label>
             <div className="grid grid-cols-4 gap-2">
               {ACCENT_COLORS.map(color => (
                 <button
                   key={color.value}
                   type="button"
                   onClick={() => updateField("accentColor", color.value)}
                   className={`h-8 w-full rounded-md transition-all border-2 ${formData.accentColor === color.value ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent hover:scale-105'}`}
                   style={{ backgroundColor: color.value }}
                   title={color.name}
                 />
               ))}
             </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/10 flex items-center gap-6">
          <FormAvatar
            title="Business logo"
            className="w-20 h-20 bg-background"
            defaultValue={formData.businessLogo || "/logo/logo.svg"}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const objectUrl = URL.createObjectURL(file)
                updateField("businessLogo", objectUrl)
              } else {
                updateField("businessLogo", null)
              }
            }}
          />
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                title="Document title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. INVOICE"
              />
              <FormSelectCurrency
                title="Document currency"
                currencies={currencies}
                value={formData.currency}
                onValueChange={(v) => updateField("currency", v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Field Labels & Content Section ───────────────────────────── */}
      <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold text-foreground">Document Details & Metadata</h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormInput
                title="Issue date label"
                value={formData.issueDateLabel}
                onChange={(e) => updateField("issueDateLabel", e.target.value)}
              />
              <FormInput
                title="Due date label"
                value={formData.dueDateLabel}
                onChange={(e) => updateField("dueDateLabel", e.target.value)}
              />
            </div>
            <div className="space-y-4">
               <FormInput
                title="Organization section label"
                value={formData.companyDetailsLabel}
                onChange={(e) => updateField("companyDetailsLabel", e.target.value)}
              />
              <FormInput
                title="Customer section label"
                value={formData.billToLabel}
                onChange={(e) => updateField("billToLabel", e.target.value)}
              />
              <FormInput
                title="Currency label"
                value={formData.currencyLabel || "Currency"}
                onChange={(e) => updateField("currencyLabel", e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border/10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormTextarea
              title="Default Subject"
              value={formData.subject || ""}
              onChange={(e) => updateField("subject", e.target.value)}
              placeholder="e.g. Project Delivery - Q1"
              rows={2}
            />
            <FormTextarea
              title="Default Description"
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Standard context or scope of work..."
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* ─── Table Configuration Section ─────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold text-foreground">Table & Item Labels</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <FormInput
            title="Items column"
            value={formData.itemLabel}
            onChange={(e) => updateField("itemLabel", e.target.value)}
          />
          <FormInput
            title="Quantity column"
            value={formData.quantityLabel}
            onChange={(e) => updateField("quantityLabel", e.target.value)}
          />
          <FormInput
            title="Price column"
            value={formData.unitPriceLabel}
            onChange={(e) => updateField("unitPriceLabel", e.target.value)}
          />
          <FormInput
            title="Discount column"
            value={formData.discountLabel}
            onChange={(e) => updateField("discountLabel", e.target.value)}
          />
          <FormInput
            title="Subtotal column"
            value={formData.subtotalLabel}
            onChange={(e) => updateField("subtotalLabel", e.target.value)}
          />
          <FormInput
            title="Summary subtotal label"
            value={formData.summarySubtotalLabel}
            onChange={(e) => updateField("summarySubtotalLabel", e.target.value)}
          />
          <FormInput
            title="Summary total label"
            value={formData.summaryTotalLabel}
            onChange={(e) => updateField("summaryTotalLabel", e.target.value)}
          />
        </div>
      </div>

      {/* ─── Footer Details Section ──────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold text-foreground">Footer Notes & Terms</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormTextarea
            title="Default Notes"
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="e.g. Thank you for your business..."
            rows={3}
          />
          <FormTextarea
            title="Payment Instructions"
            value={formData.bankDetails}
            onChange={(e) => updateField("bankDetails", e.target.value)}
            placeholder="Bank details or payment links..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )
})

InvoiceTemplateForm.displayName = "InvoiceTemplateForm"

export default InvoiceTemplateForm

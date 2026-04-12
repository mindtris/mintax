"use client"

import { saveEmailTemplateSettingsAction } from "@/app/(app)/settings/actions"
import { Button } from "@/components/ui/button"
import { DataGrid, DataGridColumn } from "@/components/ui/data-grid"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useActionState, useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// ─── Email template definitions ─────────────────────────────────────────────

interface EmailTemplate {
  id: string
  name: string
  category: string
  module: string
  sentTo: string
  subjectKey: string
  subjectDefault: string
  subjectVars: string
  fields: {
    key: string
    label: string
    type: "input" | "textarea"
    placeholder: string
    vars?: string
  }[]
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ── Bills ──
  {
    id: "bill_reminder",
    name: "Bill reminder",
    category: "Bills",
    module: "Accounting",
    sentTo: "Admin",
    subjectKey: "email_bill_reminder_subject",
    subjectDefault: "Bill {billNumber} from {vendorName} is {status}",
    subjectVars: "{billNumber}, {vendorName}, {orgName}, {status}",
    fields: [
      { key: "email_bill_reminder_footer", label: "Footer note", type: "textarea", placeholder: "This is an automated reminder from {orgName}." },
    ],
  },
  {
    id: "bill_recurring",
    name: "Bill recurring",
    category: "Bills",
    module: "Accounting",
    sentTo: "Admin",
    subjectKey: "email_bill_recurring_subject",
    subjectDefault: "Recurring expense processed: {billName}",
    subjectVars: "{billName}, {orgName}, {recurrence}",
    fields: [
      { key: "email_bill_recurring_footer", label: "Footer note", type: "textarea", placeholder: "This is an automated notification from {orgName}." },
    ],
  },
  // ── Invoices ──
  {
    id: "invoice_new",
    name: "New invoice",
    category: "Invoices",
    module: "Accounting",
    sentTo: "Customer",
    subjectKey: "email_invoice_subject",
    subjectDefault: "Invoice {invoiceNumber} from {orgName}",
    subjectVars: "{invoiceNumber}, {orgName}, {clientName}",
    fields: [
      { key: "email_invoice_greeting", label: "Greeting message", type: "textarea", placeholder: "A new invoice has been generated for your recent project with {orgName}.", vars: "{clientName}, {orgName}, {invoiceNumber}" },
      { key: "email_invoice_footer_note", label: "Footer note", type: "textarea", placeholder: "Thank you for your business." },
    ],
  },
  {
    id: "invoice_reminder_customer",
    name: "Invoice reminder",
    category: "Invoices",
    module: "Accounting",
    sentTo: "Customer",
    subjectKey: "email_invoice_reminder_customer_subject",
    subjectDefault: "Invoice {invoiceNumber} is {status}",
    subjectVars: "{invoiceNumber}, {orgName}, {clientName}, {status}",
    fields: [
      { key: "email_invoice_reminder_customer_footer", label: "Footer note", type: "textarea", placeholder: "If you have already sent the payment, please disregard this reminder." },
    ],
  },
  {
    id: "invoice_reminder_admin",
    name: "Invoice reminder",
    category: "Invoices",
    module: "Accounting",
    sentTo: "Admin",
    subjectKey: "email_invoice_reminder_admin_subject",
    subjectDefault: "Invoice {invoiceNumber} is {status}",
    subjectVars: "{invoiceNumber}, {orgName}, {clientName}, {status}",
    fields: [
      { key: "email_invoice_reminder_admin_footer", label: "Footer note", type: "textarea", placeholder: "This is an automated reminder from {orgName}." },
    ],
  },
  {
    id: "invoice_recurring_customer",
    name: "Invoice recurring",
    category: "Invoices",
    module: "Accounting",
    sentTo: "Customer",
    subjectKey: "email_invoice_recurring_customer_subject",
    subjectDefault: "Recurring invoice {invoiceNumber} generated",
    subjectVars: "{invoiceNumber}, {orgName}, {clientName}, {recurrence}",
    fields: [
      { key: "email_invoice_recurring_customer_footer", label: "Footer note", type: "textarea", placeholder: "Thank you for your continued business." },
    ],
  },
  {
    id: "invoice_recurring_admin",
    name: "Invoice recurring",
    category: "Invoices",
    module: "Accounting",
    sentTo: "Admin",
    subjectKey: "email_invoice_recurring_admin_subject",
    subjectDefault: "Recurring invoice {invoiceNumber} generated",
    subjectVars: "{invoiceNumber}, {orgName}, {clientName}, {recurrence}",
    fields: [
      { key: "email_invoice_recurring_admin_footer", label: "Footer note", type: "textarea", placeholder: "This is an automated notification from {orgName}." },
    ],
  },
  {
    id: "invoice_payment_receipt",
    name: "Invoice payment receipt",
    category: "Invoices",
    module: "Accounting",
    sentTo: "Customer",
    subjectKey: "email_invoice_payment_receipt_subject",
    subjectDefault: "Payment receipt for invoice {invoiceNumber}",
    subjectVars: "{invoiceNumber}, {orgName}, {clientName}",
    fields: [
      { key: "email_invoice_payment_receipt_footer", label: "Footer note", type: "textarea", placeholder: "This email serves as your payment receipt." },
    ],
  },
  {
    id: "invoice_payment_received",
    name: "Invoice payment received",
    category: "Invoices",
    module: "Accounting",
    sentTo: "Admin",
    subjectKey: "email_invoice_payment_received_subject",
    subjectDefault: "Payment received for invoice {invoiceNumber}",
    subjectVars: "{invoiceNumber}, {orgName}, {clientName}",
    fields: [
      { key: "email_invoice_payment_received_footer", label: "Footer note", type: "textarea", placeholder: "This is an automated notification from {orgName}." },
    ],
  },
  // ── Payments ──
  {
    id: "payment_receipt",
    name: "Payment receipt",
    category: "Payments",
    module: "Accounting",
    sentTo: "Customer",
    subjectKey: "email_payment_receipt_subject",
    subjectDefault: "Payment receipt from {orgName}",
    subjectVars: "{referenceNumber}, {recipientName}, {orgName}",
    fields: [
      { key: "email_payment_receipt_footer", label: "Footer note", type: "textarea", placeholder: "This email serves as your payment confirmation." },
    ],
  },
  {
    id: "payment_made",
    name: "Payment made",
    category: "Payments",
    module: "Accounting",
    sentTo: "Vendor",
    subjectKey: "email_payment_made_subject",
    subjectDefault: "Payment sent to {vendorName}",
    subjectVars: "{referenceNumber}, {vendorName}, {orgName}",
    fields: [
      { key: "email_payment_made_footer", label: "Footer note", type: "textarea", placeholder: "This email serves as your payment confirmation." },
    ],
  },
  // ── Others ──
  {
    id: "reminder",
    name: "Reminder notification",
    category: "Others",
    module: "Pipeline",
    sentTo: "Assignee",
    subjectKey: "email_reminder_subject",
    subjectDefault: "Reminder: {reminderTitle}",
    subjectVars: "{reminderTitle}, {orgName}, {category}",
    fields: [
      { key: "email_reminder_footer_note", label: "Footer note", type: "textarea", placeholder: "Custom message shown below the reminder details." },
    ],
  },
  {
    id: "otp",
    name: "Verification code",
    category: "Others",
    module: "Authentication",
    sentTo: "User",
    subjectKey: "email_otp_subject",
    subjectDefault: "Your Mintax verification code",
    subjectVars: "",
    fields: [],
  },
  {
    id: "newsletter",
    name: "Newsletter welcome",
    category: "Others",
    module: "Engage",
    sentTo: "Subscriber",
    subjectKey: "email_newsletter_subject",
    subjectDefault: "Welcome to Mintax Newsletter!",
    subjectVars: "",
    fields: [
      { key: "email_newsletter_greeting", label: "Greeting message", type: "textarea", placeholder: "Thank you for subscribing to our updates." },
    ],
  },
]

// ─── Row type for the data grid ─────────────────────────────────────────────

interface TemplateRow {
  id: string
  name: string
  category: string
  module: string
  sentTo: string
  subject: string
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  settings: Record<string, string>
  orgName: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Bills: "bg-primary/10 text-primary rounded-full",
  Invoices: "bg-accent text-accent-foreground rounded-full",
  Payments: "bg-secondary text-secondary-foreground rounded-full",
  Others: "bg-muted text-muted-foreground rounded-full",
}

const SENT_TO_COLORS: Record<string, string> = {
  Admin: "bg-muted text-muted-foreground rounded-full",
  Customer: "bg-primary/10 text-primary rounded-full",
  Vendor: "bg-accent text-accent-foreground rounded-full",
  Assignee: "bg-secondary text-secondary-foreground rounded-full",
  User: "bg-muted text-muted-foreground rounded-full",
  Subscriber: "bg-primary/10 text-primary rounded-full",
}

export default function EmailTemplateSettingsForm({ settings, orgName }: Props) {
  const [saveState, saveAction, pending] = useActionState(saveEmailTemplateSettingsAction, null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [globalSheetOpen, setGlobalSheetOpen] = useState(false)
  const [globalForm, setGlobalForm] = useState({
    email_sender_name: settings.email_sender_name || "",
    email_reply_to: settings.email_reply_to || "",
    email_footer_text: settings.email_footer_text || "",
  })

  useEffect(() => {
    if (saveState?.success) {
      toast.success("Email settings saved")
      setSelectedTemplate(null)
      setGlobalSheetOpen(false)
    }
    if (saveState?.error) toast.error(saveState.error)
  }, [saveState])

  const rows: TemplateRow[] = useMemo(
    () =>
      EMAIL_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        module: t.module,
        sentTo: t.sentTo,
        subject: settings[t.subjectKey] || t.subjectDefault,
      })),
    [settings]
  )

  const openEditSheet = useCallback(
    (row: TemplateRow) => {
      const template = EMAIL_TEMPLATES.find((t) => t.id === row.id)!
      const data: Record<string, string> = {
        [template.subjectKey]: settings[template.subjectKey] || "",
      }
      template.fields.forEach((f) => {
        data[f.key] = settings[f.key] || ""
      })
      setFormData(data)
      setSelectedTemplate(template)
    },
    [settings]
  )

  const columns: DataGridColumn<TemplateRow>[] = [
    {
      key: "name",
      label: "Template",
      sortable: true,
      className: "font-semibold",
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[row.category] || "bg-muted text-muted-foreground rounded-full"}`}>
          {row.category}
        </span>
      ),
    },
    {
      key: "sentTo",
      label: "Sent to",
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${SENT_TO_COLORS[row.sentTo] || "bg-muted text-muted-foreground rounded-full"}`}>
          {row.sentTo}
        </span>
      ),
    },
    {
      key: "subject",
      label: "Subject line",
      className: "text-muted-foreground max-w-[300px] truncate",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">Email templates</h2>
            <div className="bg-secondary text-sm px-2 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
              {rows.length}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Customize subject lines, greetings, and footer notes for each email type.
          </p>
        </div>
        <Button onClick={() => setGlobalSheetOpen(true)}>
          Global settings
        </Button>
      </div>

      {/* Data grid */}
      <DataGrid
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={openEditSheet}
        emptyTitle="No email templates"
        emptyDescription="Email templates will appear here."
      />

      {/* Template edit sheet */}
      <Sheet open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>{selectedTemplate?.name}</SheetTitle>
            <div className="flex gap-2 mt-1">
              {selectedTemplate && (
                <>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[selectedTemplate.category] || "bg-muted text-muted-foreground rounded-full"}`}>{selectedTemplate.category}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${SENT_TO_COLORS[selectedTemplate.sentTo] || "bg-muted text-muted-foreground rounded-full"}`}>Sent to {selectedTemplate.sentTo.toLowerCase()}</span>
                </>
              )}
            </div>
          </SheetHeader>
          <form action={saveAction} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Subject line */}
              {selectedTemplate && (
                <div className="space-y-2">
                  <Label htmlFor={selectedTemplate.subjectKey}>Subject line</Label>
                  <Input
                    id={selectedTemplate.subjectKey}
                    name={selectedTemplate.subjectKey}
                    value={formData[selectedTemplate.subjectKey] || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, [selectedTemplate.subjectKey]: e.target.value }))}
                    placeholder={selectedTemplate.subjectDefault}
                  />
                  {selectedTemplate.subjectVars && (
                    <p className="text-[10px] text-muted-foreground">
                      Variables: {selectedTemplate.subjectVars}
                    </p>
                  )}
                </div>
              )}

              {/* Additional fields */}
              {selectedTemplate?.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.key}
                      name={field.key}
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      name={field.key}
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.vars && (
                    <p className="text-[10px] text-muted-foreground">Variables: {field.vars}</p>
                  )}
                </div>
              ))}

              {selectedTemplate?.fields.length === 0 && (
                <p className="text-sm text-muted-foreground">Only the subject line is customizable for this template.</p>
              )}
            </div>
            <SheetFooter className="px-6 py-4 shrink-0 border-t">
              <div className="flex gap-2 w-full">
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSelectedTemplate(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Global settings sheet */}
      <Sheet open={globalSheetOpen} onOpenChange={setGlobalSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Global email settings</SheetTitle>
            <p className="text-sm text-muted-foreground">Settings applied to all outgoing emails.</p>
          </SheetHeader>
          <form action={saveAction} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email_sender_name">Sender name</Label>
                <Input
                  id="email_sender_name"
                  name="email_sender_name"
                  value={globalForm.email_sender_name}
                  onChange={(e) => setGlobalForm((p) => ({ ...p, email_sender_name: e.target.value }))}
                  placeholder={orgName}
                />
                <p className="text-[10px] text-muted-foreground">
                  Display name shown in the &quot;From&quot; field.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_reply_to">Reply-to email</Label>
                <Input
                  id="email_reply_to"
                  name="email_reply_to"
                  type="email"
                  value={globalForm.email_reply_to}
                  onChange={(e) => setGlobalForm((p) => ({ ...p, email_reply_to: e.target.value }))}
                  placeholder="billing@yourcompany.com"
                />
                <p className="text-[10px] text-muted-foreground">
                  Replies to your emails will be sent to this address.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_footer_text">Footer text</Label>
                <Textarea
                  id="email_footer_text"
                  name="email_footer_text"
                  value={globalForm.email_footer_text}
                  onChange={(e) => setGlobalForm((p) => ({ ...p, email_footer_text: e.target.value }))}
                  placeholder="You received this email because you have a Mintax account."
                  rows={3}
                />
                <p className="text-[10px] text-muted-foreground">
                  Custom footer text shown at the bottom of all emails.
                </p>
              </div>
            </div>
            <SheetFooter className="px-6 py-4 shrink-0 border-t">
              <div className="flex gap-2 w-full">
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setGlobalSheetOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

"use client"

import { 
  addEmailTemplateAction, 
  editEmailTemplateAction, 
  deleteEmailTemplateAction,
  saveEmailTemplateSettingsAction,
  sendTestEmailAction
} from "@/app/(app)/settings/actions"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActionState, useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Eye, Send, Loader2, Trash2, CheckCircle2 } from "lucide-react"
import { EmailTemplate as DbTemplate } from "@/lib/prisma/client"

// ─── Email Template Registry ─────────────────────────────────────────────

interface RegistryTemplate {
  module: string
  event: string
  name: string
  category: "Accounting" | "Pipeline" | "Hire" | "Others"
  sentTo: "Customer" | "Admin" | "Vendor" | "Applicant" | "Team" | "Subscriber"
  subjectDefault: string
  greetingDefault: string
  bodyDefault: string
  variables: string[]
}

const TEMPLATE_REGISTRY: RegistryTemplate[] = [
  {
    module: "invoice",
    event: "sent",
    name: "New invoice",
    category: "Accounting",
    sentTo: "Customer",
    subjectDefault: "Invoice {invoiceNumber} from {orgName}",
    greetingDefault: "Hi {clientName},",
    bodyDefault: "A new invoice has been generated for your recent project with {orgName}.\n\nYou can view the details below or download the attached PDF.",
    variables: ["invoiceNumber", "clientName", "orgName", "total", "dueDate"],
  },
  {
    module: "invoice",
    event: "reminder",
    name: "Invoice reminder",
    category: "Accounting",
    sentTo: "Customer",
    subjectDefault: "Reminder: Invoice {invoiceNumber} is {status}",
    greetingDefault: "Hi {clientName},",
    bodyDefault: "This is a friendly reminder that invoice {invoiceNumber} for {total} is currently {status}.\n\nIf you have already sent the payment, please disregard this message.",
    variables: ["invoiceNumber", "clientName", "orgName", "total", "status", "dueDate"],
  },
  {
    module: "bill",
    event: "reminder",
    name: "Bill reminder",
    category: "Accounting",
    sentTo: "Admin",
    subjectDefault: "Bill {billNumber} from {vendorName} is {status}",
    greetingDefault: "Hello Team,",
    bodyDefault: "The bill {billNumber} from {vendorName} is currently {status}.\n\nPlease ensure payment is processed by {dueDate}.",
    variables: ["billNumber", "vendorName", "orgName", "total", "status", "dueDate"],
  },
  {
    module: "estimate",
    event: "sent",
    name: "New estimate",
    category: "Accounting",
    sentTo: "Customer",
    subjectDefault: "Estimate {estimateNumber} from {orgName}",
    greetingDefault: "Hi {clientName},",
    bodyDefault: "We have prepared an estimate for your consideration. Please review the attached document and let us know if you would like to proceed.",
    variables: ["estimateNumber", "clientName", "orgName", "total"],
  },
  {
    module: "lead",
    event: "assigned",
    name: "Lead assignment",
    category: "Pipeline",
    sentTo: "Admin",
    subjectDefault: "New Lead Assigned: {leadName}",
    greetingDefault: "Hello {assigneeName},",
    bodyDefault: "A new lead '{leadName}' from {source} has been assigned to you. \n\nPlease follow up as soon as possible.",
    variables: ["leadName", "source", "assigneeName", "orgName"],
  },
  {
    module: "hire",
    event: "application_received",
    name: "Application confirmation",
    category: "Hire",
    sentTo: "Subscriber",
    subjectDefault: "Application received: {jobTitle} at {orgName}",
    greetingDefault: "Hi {applicantName},",
    bodyDefault: "Thank you for applying for the {jobTitle} position. We have received your application and will review it shortly.",
    variables: ["applicantName", "jobTitle", "orgName"],
  },
  {
    module: "team",
    event: "invite",
    name: "Team invitation",
    category: "Others",
    sentTo: "Team",
    subjectDefault: "Invitation to join {orgName} on Mintax",
    greetingDefault: "Welcome!",
    bodyDefault: "{inviterName} has invited you to join the {orgName} team on Mintax.\n\nClick the button below to accept the invitation and get started.",
    variables: ["inviterName", "orgName"],
  },
]

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  settings: Record<string, string>
  orgName: string
  templates: DbTemplate[]
  orgId: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Accounting: "bg-primary/10 text-primary rounded-full",
  Pipeline: "bg-accent text-accent-foreground rounded-full",
  Hire: "bg-secondary text-secondary-foreground rounded-full",
  Others: "bg-muted text-muted-foreground rounded-full",
}

export default function EmailTemplateSettingsForm({ settings, orgName, templates, orgId }: Props) {
  const [saveSettingsState, saveSettingsAction, pendingSettings] = useActionState(saveEmailTemplateSettingsAction, null)
  
  const [selectedRegistry, setSelectedRegistry] = useState<RegistryTemplate | null>(null)
  const [selectedDbTemplate, setSelectedDbTemplate] = useState<DbTemplate | null>(null)
  
  const [editForm, setEditForm] = useState({
    subject: "",
    greeting: "",
    body: "",
    footer: "",
    name: "",
    isDefault: true,
  })

  // Preview state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [testSendPending, setTestSendPending] = useState(false)

  useEffect(() => {
    if (saveSettingsState?.success) toast.success("Email settings saved")
  }, [saveSettingsState])

  const rows = useMemo(() => {
    return TEMPLATE_REGISTRY.map((reg) => {
      const dbTemplate = templates.find(t => t.module === reg.module && t.event === reg.event && t.isDefault)
      return {
        id: reg.module + "_" + reg.event,
        registry: reg,
        dbTemplate,
        name: reg.name,
        category: reg.category,
        sentTo: reg.sentTo,
        subject: dbTemplate?.subject || reg.subjectDefault,
        status: dbTemplate ? "Customized" : "Default",
      }
    })
  }, [templates])

  const openSheet = useCallback((row: typeof rows[0]) => {
    setSelectedRegistry(row.registry)
    setSelectedDbTemplate(row.dbTemplate || null)
    setEditForm({
      name: row.dbTemplate?.name || row.registry.name,
      subject: row.dbTemplate?.subject || row.registry.subjectDefault,
      greeting: row.dbTemplate?.greeting || row.registry.greetingDefault,
      body: row.dbTemplate?.body || row.registry.bodyDefault,
      footer: row.dbTemplate?.footer || "",
      isDefault: true,
    })
    setPreviewHtml(null)
  }, [])

  const handlePreview = async () => {
    if (!selectedRegistry) return
    setIsPreviewLoading(true)
    
    // Create mock variables
    const mockVars: Record<string, string> = { orgName }
    selectedRegistry.variables.forEach(v => {
      mockVars[v] = `[${v}]`
    })

    try {
      const res = await fetch("/api/email/preview", {
        method: "POST",
        body: JSON.stringify({
          ...editForm,
          variables: mockVars,
        })
      })
      const data = await res.json()
      setPreviewHtml(data.html)
    } catch (err) {
      toast.error("Failed to generate preview")
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleSendTest = async () => {
    if (!selectedRegistry) return
    setTestSendPending(true)
    
    const mockVars: Record<string, string> = { orgName }
    selectedRegistry.variables.forEach(v => {
      mockVars[v] = `[${v}]`
    })

    try {
      const res = await sendTestEmailAction(orgId, {
        ...editForm,
        variables: mockVars,
      })
      if (res.success) toast.success("Test email sent to your address")
      else toast.error("Failed to send test email")
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setTestSendPending(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!selectedRegistry) return
    
    const data = {
      ...editForm,
      module: selectedRegistry.module,
      event: selectedRegistry.event,
    }

    try {
      let res
      if (selectedDbTemplate) {
        res = await editEmailTemplateAction(orgId, selectedDbTemplate.id, data)
      } else {
        res = await addEmailTemplateAction(orgId, data)
      }

      if (res.success) {
        toast.success("Template saved successfully")
        setSelectedRegistry(null)
      } else {
        toast.error(res.error || "Failed to save template")
      }
    } catch (err) {
      toast.error("An error occurred")
    }
  }

  const handleDelete = async () => {
    if (!selectedDbTemplate) return
    if (!confirm("Are you sure you want to revert to the default template? This will delete your customizations.")) return
    
    try {
      const res = await deleteEmailTemplateAction(orgId, selectedDbTemplate.id)
      if (res.success) {
        toast.success("Reverted to default")
        setSelectedRegistry(null)
      }
    } catch (err) {
      toast.error("Failed to delete template")
    }
  }

  const columns: DataGridColumn<typeof rows[0]>[] = [
    { key: "name", label: "Template", className: "font-semibold" },
    { 
      key: "category", 
      label: "Category", 
      render: (row) => (
        <span className={`px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[row.category]}`}>{row.category}</span>
      )
    },
    { key: "sentTo", label: "Sent to" },
    { key: "subject", label: "Subject", className: "text-muted-foreground truncate max-w-[200px]" },
    { 
      key: "status", 
      label: "Status",
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.dbTemplate ? "text-primary" : "text-muted-foreground"}`}>
          {row.dbTemplate ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
          {row.status}
        </span>
      )
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Email templates</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage transactional email content, branding, and testing.</p>
        </div>
      </div>

      <DataGrid
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={openSheet}
      />

      <Sheet open={!!selectedRegistry} onOpenChange={(open) => !open && setSelectedRegistry(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col gap-0 border-l-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>{selectedRegistry?.name}</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedRegistry?.module} / {selectedRegistry?.event}
                </p>
              </div>
              {selectedDbTemplate && (
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </SheetHeader>

          <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b bg-muted/20">
              <TabsList className="bg-transparent h-12 p-0 gap-6">
                <TabsTrigger value="edit" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">Editor</TabsTrigger>
                <TabsTrigger value="preview" onClick={handlePreview} className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">Preview</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="flex-1 overflow-y-auto p-6 m-0 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Subject Line</Label>
                  <Input 
                    value={editForm.subject}
                    onChange={(e) => setEditForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Email subject..."
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Greeting</Label>
                  <Input 
                    value={editForm.greeting}
                    onChange={(e) => setEditForm(f => ({ ...f, greeting: e.target.value }))}
                    placeholder="Hi {name},"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Body Paragraphs</Label>
                  <Textarea 
                    value={editForm.body}
                    onChange={(e) => setEditForm(f => ({ ...f, body: e.target.value }))}
                    rows={10}
                    className="font-mono text-sm leading-relaxed"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Footer Note</Label>
                  <Input 
                    value={editForm.footer}
                    onChange={(e) => setEditForm(f => ({ ...f, footer: e.target.value }))}
                    placeholder="Thank you for your business."
                  />
                </div>
                
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">Available Variables</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRegistry?.variables.map(v => (
                      <code key={v} className="px-1.5 py-0.5 bg-background border rounded text-[11px] text-primary">{`{${v}}`}</code>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden m-0 p-0 flex flex-col bg-muted/10">
              {isPreviewLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : previewHtml ? (
                <iframe 
                  srcDoc={previewHtml}
                  className="w-full h-full bg-white border-0"
                  title="Email Preview"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Click the Preview tab to see how your email looks.
                </div>
              )}
            </TabsContent>
          </Tabs>

          <SheetFooter className="px-6 py-4 border-t bg-muted/5">
            <div className="flex items-center justify-between w-full">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSendTest} 
                disabled={testSendPending}
                className="gap-2"
              >
                {testSendPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Test
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setSelectedRegistry(null)}>Cancel</Button>
                <Button onClick={handleSaveTemplate}>Save Template</Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

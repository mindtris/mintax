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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActionState, useCallback, useEffect, useMemo, useState, useImperativeHandle, forwardRef } from "react"
import { toast } from "sonner"
import { Eye, Send, Loader2, Trash2, CheckCircle2 } from "lucide-react"
import { EmailTemplate as DbTemplate } from "@/lib/prisma/client"

// ─── Email Template Registry ─────────────────────────────────────────────

import { RegistryTemplate, TEMPLATE_REGISTRY } from "@/lib/constants/email-templates"

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  settings: Record<string, string>
  orgName: string
  templates: DbTemplate[]
  orgId: string
  // Optional props for direct editor mode (Template Hub)
  initialRegistry?: RegistryTemplate
  initialDbTemplate?: DbTemplate | null
  onSuccess?: () => void
  activeTab?: string
  pureFormMode?: boolean
}

export interface EmailEditorHandle {
  save: () => Promise<void>
  test: () => Promise<void>
}

const EmailTemplateSettingsForm = forwardRef<EmailEditorHandle, Props>(({ 
  settings, 
  orgName, 
  templates, 
  orgId,
  initialRegistry,
  initialDbTemplate: propDbTemplate,
  onSuccess,
  activeTab = "edit",
  pureFormMode = false
}, ref) => {
  const [saveSettingsState, saveSettingsAction, pendingSettings] = useActionState(saveEmailTemplateSettingsAction, null)
  
  const [selectedRegistry, setSelectedRegistry] = useState<RegistryTemplate | null>(initialRegistry || null)
  const [selectedDbTemplate, setSelectedDbTemplate] = useState<DbTemplate | null>(propDbTemplate || null)
  
  const [editForm, setEditForm] = useState({
    name: propDbTemplate?.name || initialRegistry?.name || "",
    subject: propDbTemplate?.subject || initialRegistry?.subjectDefault || "",
    greeting: propDbTemplate?.greeting || initialRegistry?.greetingDefault || "",
    body: propDbTemplate?.body || initialRegistry?.bodyDefault || "",
    footer: propDbTemplate?.footer || "",
    isDefault: true,
  })

  // Preview state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [testSendPending, setTestSendPending] = useState(false)

  useImperativeHandle(ref, () => ({
    save: handleSaveTemplate,
    test: handleSendTest
  }))

  useEffect(() => {
    if (saveSettingsState?.success) {
      toast.success("Email settings saved")
      onSuccess?.()
    }
  }, [saveSettingsState, onSuccess])

  // If initial props change, re-sync state
  useEffect(() => {
    if (initialRegistry) {
      setSelectedRegistry(initialRegistry)
      setSelectedDbTemplate(propDbTemplate || null)
      setEditForm({
        name: propDbTemplate?.name || initialRegistry.name,
        subject: propDbTemplate?.subject || initialRegistry.subjectDefault,
        greeting: propDbTemplate?.greeting || initialRegistry.greetingDefault,
        body: propDbTemplate?.body || initialRegistry.bodyDefault,
        footer: propDbTemplate?.footer || "",
        isDefault: true,
      })
    }
  }, [initialRegistry, propDbTemplate])

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

  // Reactive preview trigger for header tabs
  useEffect(() => {
    if (activeTab === "preview" && (initialRegistry || selectedRegistry)) {
      handlePreview()
    }
  }, [activeTab])

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

  const editorContent = (
    <>
      <TabsContent value="edit" className={`m-0 space-y-4 px-6 py-6 ${pureFormMode ? "" : "flex-1 overflow-y-auto min-h-0"}`}>
        <div className="space-y-4 max-w-3xl">
          <FormInput
            title="Subject line"
            value={editForm.subject}
            onChange={(e) => setEditForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Email subject..."
          />
          
          <FormInput
            title="Greeting"
            value={editForm.greeting}
            onChange={(e) => setEditForm(f => ({ ...f, greeting: e.target.value }))}
            placeholder="Hi {name},"
          />

          <FormTextarea
            title="Body paragraphs"
            value={editForm.body}
            onChange={(e) => setEditForm(f => ({ ...f, body: e.target.value }))}
            rows={8}
            className="font-mono text-sm leading-relaxed resize-none"
          />

          <FormInput
            title="Footer note"
            value={editForm.footer}
            onChange={(e) => setEditForm(f => ({ ...f, footer: e.target.value }))}
            placeholder="Thank you for your business."
          />
          
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <label className="text-xs font-semibold text-muted-foreground mb-2.5 block">Available variables</label>
            <div className="flex flex-wrap gap-1.5">
              {(initialRegistry || selectedRegistry)?.variables.map(v => (
                <code key={v} className="px-1.5 py-0.5 bg-background border rounded text-[11px] text-primary font-mono">{`{${v}}`}</code>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="preview" className={`m-0 p-0 flex flex-col bg-muted/10 min-h-[500px] h-full ${pureFormMode ? "flex-1" : "flex-1 overflow-hidden"}`}>
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
            Please switch back to Editor and check your content.
          </div>
        )}
      </TabsContent>

      {!pureFormMode && (
        <div className="px-6 py-4 border-t bg-muted/5 shrink-0">
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
              {!initialRegistry && <Button variant="secondary" onClick={() => setSelectedRegistry(null)}>Cancel</Button>}
              <Button onClick={handleSaveTemplate}>Save Template</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (initialRegistry) {
    return (
      <>
        {editorContent}
      </>
    )
  }

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
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize tracking-tight font-medium">
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
          {editorContent}
        </SheetContent>
      </Sheet>
    </div>
  )
})

EmailTemplateSettingsForm.displayName = "EmailTemplateSettingsForm"
export default EmailTemplateSettingsForm

"use client"

import { FormInput, FormSelect, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
// import { LEAD_SOURCES, LEAD_STAGES, SOURCE_LABELS, STAGE_LABELS } from "@/lib/services/leads"

import { useActionState, useEffect, useState } from "react"
import { createLeadAction, getLeadMeetingsAction, updateLeadAction } from "@/app/(app)/sales/actions"
import { Calendar, ExternalLink, Loader2, Target } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

type LeadMeeting = {
  id: string
  title: string
  startAt: string | Date
  endAt: string | Date
  timezone: string
  status: string
  attendeeEmail: string
  location: string | null
  externalUrl: string | null
  externalProvider: string
}

const MEETING_STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  no_show: "No show",
}

const sourceItems = [
  { code: "website", name: "Website" },
  { code: "referral", name: "Referral" },
  { code: "linkedin", name: "LinkedIn" },
  { code: "cold_call", name: "Cold call" },
  { code: "advertisement", name: "Advertisement" },
  { code: "other", name: "Other" },
]

export function NewLeadSheet({
  children,
  lead,
  currency = "INR",
  categories,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: React.ReactNode
  lead?: any
  currency?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  categories?: any[]
}) {
  const stageItems = categories?.map((c) => ({ code: c.code, name: c.name })) || []
  const isEdit = !!lead
  const action = isEdit ? updateLeadAction : createLeadAction
  const [state, formAction, pending] = useActionState(action, null)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const [meetings, setMeetings] = useState<LeadMeeting[]>([])
  const [meetingsLoading, setMeetingsLoading] = useState(false)

  useEffect(() => {
    if (state?.success && open) {
      toast.success(isEdit ? "Lead updated" : "Lead created")
      setOpen(false)
    }
  }, [state?.success, open, isEdit, setOpen])

  useEffect(() => {
    if (!open || !isEdit || !lead?.id) return
    let cancelled = false
    setMeetingsLoading(true)
    getLeadMeetingsAction(lead.id)
      .then((rows) => {
        if (!cancelled) setMeetings(rows as LeadMeeting[])
      })
      .finally(() => {
        if (!cancelled) setMeetingsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, isEdit, lead?.id])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-8 pt-8 pb-6 shrink-0 bg-muted/5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              {isEdit ? "Edit lead" : "New lead"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <form action={formAction} className="flex flex-col gap-8">
            {isEdit && <input type="hidden" name="leadId" value={lead.id} />}

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Lead information</h4>
              <FormInput title="Lead title" name="title" required defaultValue={lead?.title} placeholder="e.g. Website redesign project" />
              <FormInput title="Contact name" name="contactName" required defaultValue={lead?.contactName} placeholder="Akshitha Kandikanti" />
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Contact details</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormInput title="Email" name="email" type="email" defaultValue={lead?.email} placeholder="akshitha@mindtris.com" />
                <FormInput title="Phone" name="phone" defaultValue={lead?.phone} placeholder="+91..." />
              </div>

              <FormInput title="Company" name="company" defaultValue={lead?.company} placeholder="Mindtris" />
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Value & Probability</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  title="Stage"
                  name="stage"
                  items={stageItems}
                  defaultValue={lead?.stage || categories?.[0]?.code || ""}
                  placeholder="Select stage"
                />
                <FormSelect
                  title="Source"
                  name="source"
                  items={sourceItems}
                  emptyValue=""
                  defaultValue={lead?.source || ""}
                  placeholder="Select source"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormInput title="Value" name="value" type="number" step="0.01" defaultValue={lead ? (lead.value / 100).toFixed(2) : ""} placeholder="0.00" />
                <FormInput title="Currency" name="currency" defaultValue={lead?.currency || currency} />
                <FormInput title="Probability %" name="probability" type="number" min="0" max="100" defaultValue={lead?.probability || 0} />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Expected close date</Label>
                <DatePicker name="expectedCloseAt" defaultValue={lead?.expectedCloseAt || null} placeholder="Pick a date" />
              </div>

              <FormTextarea title="Description" name="description" defaultValue={lead?.description} placeholder="Notes about this lead..." />
            </div>

            {isEdit && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Meetings</h4>
                  {meetingsLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                {!meetingsLoading && meetings.length === 0 && (
                  <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    No meetings scheduled yet. Bookings from cal.com linked to this lead will appear here.
                  </div>
                )}
                {meetings.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {meetings.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-md border bg-card px-4 py-3 flex items-start gap-3"
                      >
                        <div className="p-1.5 bg-primary/10 rounded-md mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{m.title}</span>
                            <span
                              className={
                                "text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide " +
                                (m.status === "cancelled"
                                  ? "bg-destructive/10 text-destructive"
                                  : m.status === "rescheduled"
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-primary/10 text-primary")
                              }
                            >
                              {MEETING_STATUS_LABEL[m.status] ?? m.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(m.startAt), "MMM d, yyyy 'at' h:mm a")} · {m.timezone}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {m.attendeeEmail}
                            {m.location ? ` · ${m.location}` : ""}
                          </div>
                        </div>
                        {m.externalUrl && (
                          <a
                            href={m.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{state.error}</div>
            )}

            <div className="pt-2 sticky bottom-0 bg-background">
              <Button type="submit" disabled={pending} className="w-full h-12 text-md font-semibold shadow-lg shadow-primary/20 text-white leading-none">
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {pending ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save changes" : "Create lead")}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

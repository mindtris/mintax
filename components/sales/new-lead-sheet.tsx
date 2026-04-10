"use client"

import { FormInput, FormSelect, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { LEAD_SOURCES, LEAD_STAGES, SOURCE_LABELS, STAGE_LABELS } from "@/lib/services/leads"

const stageItems = LEAD_STAGES.map((s) => ({ code: s, name: STAGE_LABELS[s] }))
const sourceItems = LEAD_SOURCES.map((s) => ({ code: s, name: SOURCE_LABELS[s] }))
import { useActionState, useState } from "react"
import { createLeadAction, updateLeadAction } from "@/app/(app)/sales/actions"

export function NewLeadSheet({
  children,
  lead,
  currency = "INR",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: React.ReactNode
  lead?: any
  currency?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = !!lead
  const action = isEdit ? updateLeadAction : createLeadAction
  const [state, formAction, pending] = useActionState(action, null)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  if (state?.success && open) {
    setTimeout(() => setOpen(false), 0)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>{isEdit ? "Edit lead" : "New lead"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form action={formAction} className="flex flex-col gap-4">
            {isEdit && <input type="hidden" name="leadId" value={lead.id} />}

            <FormInput title="Lead title" name="title" required defaultValue={lead?.title} placeholder="e.g. Website redesign project" />
            <FormInput title="Contact name" name="contactName" required defaultValue={lead?.contactName} placeholder="Full name" />

            <div className="grid grid-cols-2 gap-4">
              <FormInput title="Email" name="email" type="email" defaultValue={lead?.email} placeholder="email@example.com" />
              <FormInput title="Phone" name="phone" defaultValue={lead?.phone} placeholder="+91..." />
            </div>

            <FormInput title="Company" name="company" defaultValue={lead?.company} placeholder="Company name" />

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                title="Stage"
                name="stage"
                items={stageItems}
                defaultValue={lead?.stage || "new"}
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

            <FormInput title="Expected close date" name="expectedCloseAt" type="date" defaultValue={lead?.expectedCloseAt ? new Date(lead.expectedCloseAt).toISOString().split("T")[0] : ""} />

            <FormTextarea title="Description" name="description" defaultValue={lead?.description} placeholder="Notes about this lead..." />

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save changes" : "Create lead")}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

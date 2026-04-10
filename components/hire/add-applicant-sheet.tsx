"use client"

import { updateTalentStatusAction } from "@/app/(app)/hire/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useActionState, useState } from "react"

export function AddApplicantSheet({
  children,
  jobId,
  candidates,
}: {
  children?: React.ReactNode
  jobId: string
  candidates: any[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(async (prev: any, formData: FormData) => {
    const candidateId = formData.get("candidateId") as string
    const notes = formData.get("notes") as string
    return updateTalentStatusAction(candidateId, "new", notes)
  }, null)

  if (state?.success && open) {
    setTimeout(() => setOpen(false), 0)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-auto max-h-[80vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>Add applicant to pipeline</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="jobId" value={jobId} />

            <div className="flex flex-col gap-2">
              <Label>Select candidate *</Label>
              <Select name="candidateId" required>
                <SelectTrigger><SelectValue placeholder="Choose a candidate" /></SelectTrigger>
                <SelectContent>
                  {candidates.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} — {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {candidates.length === 0 && (
                <p className="text-xs text-muted-foreground">No candidates yet. Add candidates first.</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea name="notes" placeholder="Initial notes about this applicant..." rows={3} />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending || candidates.length === 0} className="w-full">
              {pending ? "Adding..." : "Add to pipeline"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

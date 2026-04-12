"use client"

import { createCandidateAction } from "@/app/(app)/hire/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

export function NewCandidateSheet({ 
  children, 
  defaultGroup = "ATS",
  jobs = []
}: { 
  children?: React.ReactNode,
  defaultGroup?: "ATS" | "BENCH",
  jobs?: any[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createCandidateAction, null)

  useEffect(() => {
    if (state?.success && open) {
      toast.success("Candidate added successfully")
      setOpen(false)
    }
  }, [state, open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>Add candidate</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 p-3 bg-primary/[0.03] rounded-2xl border border-primary/10 mb-2">
               <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Talent group</Label>
               <Select name="group" defaultValue={defaultGroup}>
                <SelectTrigger className="bg-transparent border-none p-0 h-auto focus:ring-0 shadow-none font-bold text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATS">Job applicant (Inbound)</SelectItem>
                  <SelectItem value="BENCH">Internal resource (Bench)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {jobs.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Associate with job</Label>
                <Select name="jobId">
                  <SelectTrigger><SelectValue placeholder="Select an active posting..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific job (Talent Pool)</SelectItem>
                    {jobs.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>First name *</Label>
                <Input name="firstName" placeholder="Akshitha" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Last name *</Label>
                <Input name="lastName" placeholder="Kandikanti" required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Email *</Label>
              <Input name="email" type="email" placeholder="akshitha@mindtris.com" required />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Phone</Label>
              <Input name="phone" placeholder="+1 (555) 000-0000" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>LinkedIn URL</Label>
              <Input name="linkedinUrl" placeholder="https://linkedin.com/in/..." />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Portfolio URL</Label>
              <Input name="portfolioUrl" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Source</Label>
                <Select name="sourcedFrom">
                  <SelectTrigger><SelectValue placeholder="How sourced?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="job_board">Job board</SelectItem>
                    <SelectItem value="website">Company website</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Work authorization</Label>
                <Select name="workAuthorization">
                  <SelectTrigger><SelectValue placeholder="Auth status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">US Citizen</SelectItem>
                    <SelectItem value="green_card">Green card</SelectItem>
                    <SelectItem value="h1b">H1-B visa</SelectItem>
                    <SelectItem value="ead">EAD</SelectItem>
                    <SelectItem value="canadian">Canadian citizen</SelectItem>
                    <SelectItem value="not_required">Not required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Resume / CV *</Label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const input = document.getElementById("candidate-resume") as HTMLInputElement
                  if (input && e.dataTransfer.files.length > 0) {
                    const dt = new DataTransfer()
                    dt.items.add(e.dataTransfer.files[0])
                    input.files = dt.files
                  }
                }}
                className="border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => document.getElementById("candidate-resume")?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Drop resume here or click to upload</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">PDF, DOC, DOCX</p>
                <input id="candidate-resume" name="resume" type="file" accept=".pdf,.doc,.docx" required className="hidden" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Marketing bio / Summary</Label>
              <textarea 
                name="marketingBio" 
                rows={3} 
                placeholder="Key skills, years of experience, and value proposition..."
                className="w-full bg-background border border-input rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending} className="w-full mt-2 shadow-lg shadow-primary/20">
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding talent...
                </>
              ) : (
                "Add candidate"
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

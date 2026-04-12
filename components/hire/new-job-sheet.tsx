"use client"

import { createJobAction } from "@/app/(app)/hire/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles } from "lucide-react"
import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"

export function NewJobSheet({
  children,
  categories,
  currency = "INR",
}: {
  children?: React.ReactNode
  categories: any[]
  currency?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createJobAction, null)
  const [description, setDescription] = useState("")
  const [requirements, setRequirements] = useState("")
  const [generating, setGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [llmPrompts, setLlmPrompts] = useState<{ id: string; name: string }[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState("")

  useEffect(() => {
    if (open) {
      fetch("/api/llm-prompts?module=hire")
        .then((r) => r.json())
        .then((data) => {
          setLlmPrompts(data.prompts || [])
          if (data.prompts?.length > 0) setSelectedPromptId(data.prompts[0].id)
        })
        .catch(() => {})
    }
  }, [open])

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    try {
      const res = await fetch("/api/hire/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, promptId: selectedPromptId || undefined }),
      })
      const data = await res.json()
      if (data.description) setDescription(data.description)
      if (data.requirements) setRequirements(data.requirements)
      setAiPrompt("")
    } catch (err) {
      console.error("Generation error:", err)
    }
    setGenerating(false)
  }

  useEffect(() => {
    if (state?.success && open) {
      toast.success("Job posting created successfully")
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
          <SheetTitle>Post new job</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Job title *</Label>
              <Input name="title" placeholder="e.g., Senior Software Engineer" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="open">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Job type</Label>
                <Select name="type" defaultValue="permanent">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="c2h">Contract-to-hire</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Department</Label>
                <Select name="categoryId">
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* AI Generation */}
            <div className="flex flex-col gap-3 border rounded-md p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI Generate
              </Label>
              {llmPrompts.length > 1 && (
                <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select prompt style" />
                  </SelectTrigger>
                  <SelectContent>
                    {llmPrompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Senior React developer, remote, fintech..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleGenerate())}
                  className="text-sm"
                />
                <Button type="button" size="sm" onClick={handleGenerate} disabled={generating || !aiPrompt.trim()}>
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea name="description" placeholder="Job description, responsibilities..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Requirements</Label>
              <Textarea name="requirements" placeholder="Skills, qualifications..." rows={3} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Experience min (years)</Label>
                <Input name="experienceMin" type="number" placeholder="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Experience max (years)</Label>
                <Input name="experienceMax" type="number" placeholder="10" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Salary min</Label>
                <Input name="salaryMin" type="number" placeholder="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Salary max</Label>
                <Input name="salaryMax" type="number" placeholder="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Select name="currency" defaultValue={currency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending} className="w-full mt-2 shadow-lg shadow-primary/20">
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating job...
                </>
              ) : (
                "Post job"
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

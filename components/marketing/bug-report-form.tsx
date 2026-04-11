"use client"

import { useActionState, useEffect, useState } from "react"
import { submitBugReportAction } from "@/app/api/bug/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bug, CheckCircle2, ExternalLink, Loader2, Upload } from "lucide-react"

export function BugReportForm() {
  const [state, formAction, isPending] = useActionState(submitBugReportAction, null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setIsSuccess(true)
    }
  }, [state])

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Issue Reported!</h2>
        <p className="text-white/60 text-sm max-w-sm mb-6">
          Your bug report has been successfully created in our GitHub repository.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 flex items-center gap-2"
            onClick={() => window.open(state?.data?.url, "_blank")}
          >
            View on GitHub
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="text-white/40 hover:text-white"
            onClick={() => window.location.href = "/"}
          >
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-white/40">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., Invoices not exporting to PDF"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-white/40">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What exactly is happening?"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="steps" className="text-xs font-semibold uppercase tracking-wider text-white/40">Steps to Reproduce</Label>
        <Textarea
          id="steps"
          name="steps"
          placeholder="1. Go to...&#10;2. Click on..."
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expected" className="text-xs font-semibold uppercase tracking-wider text-white/40">Expected Behavior</Label>
        <Input
          id="expected"
          name="expected"
          placeholder="What should have happened?"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary h-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-white/40">Your Email (Optional)</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="For updates"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="screenshot" className="text-xs font-semibold uppercase tracking-wider text-white/40">Screenshot (Optional)</Label>
          <label className="flex items-center justify-center w-full h-10 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
            <Upload className="h-4 w-4 mr-2 text-white/40" />
            <span className="text-xs text-white/60">Upload Image</span>
            <input id="screenshot" name="screenshot" type="file" accept="image/*" className="hidden" />
          </label>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm font-medium text-red-400">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 transition-all mt-4"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting Issue...
          </>
        ) : (
          "Report Bug"
        )}
      </Button>
    </form>
  )
}

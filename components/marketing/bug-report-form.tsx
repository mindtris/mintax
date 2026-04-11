"use client"

import { useActionState, useEffect, useState } from "react"
import { submitBugReportAction } from "@/app/api/bug/actions"
import { Button } from "@/components/ui/button"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { CheckCircle2, ExternalLink, Loader2, Upload } from "lucide-react"

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
        <h2 className="text-xl font-bold text-white mb-2">Issue reported</h2>
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
            Back to home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 w-full">
      <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
        <FormInput
          title="Title"
          name="title"
          placeholder="e.g., Invoices not exporting to PDF"
          required
        />

        <FormTextarea
          title="Description"
          name="description"
          placeholder="What exactly is happening?"
          required
        />

        <FormTextarea
          title="Steps to reproduce"
          name="steps"
          placeholder="1. Go to...&#10;2. Click on..."
          required
        />

        <FormInput
          title="Expected behavior"
          name="expected"
          placeholder="What should have happened?"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            title="Email (optional)"
            name="email"
            type="email"
            placeholder="For updates"
          />
          <div className="space-y-1">
            <span className="text-sm font-medium">Screenshot (optional)</span>
            <label className="flex items-center justify-center w-full h-11 rounded-md border border-input bg-background hover:bg-muted cursor-pointer transition-colors shadow-sm">
              <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload image</span>
              <input id="screenshot" name="screenshot" type="file" accept="image/*" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm font-medium text-destructive text-center">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        ) : (
          "Report a bug"
        )}
      </Button>
    </form>
  )
}

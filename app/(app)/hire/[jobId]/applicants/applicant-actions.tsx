"use client"

import { updateApplicantStatusAction } from "@/app/(app)/hire/actions"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const NEXT_STATUS: Record<string, string> = {
  new: "screening",
  screening: "interview_internal",
  interview_internal: "interview_client",
  interview_client: "offered",
  interview: "offered",
  offered: "hired",
}

export function ApplicantActions({ applicantId, currentStatus }: { applicantId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function advance() {
    const next = NEXT_STATUS[currentStatus]
    if (!next) return
    setLoading(true)
    await updateApplicantStatusAction(applicantId, next)
    router.refresh()
    setLoading(false)
  }

  async function reject() {
    setLoading(true)
    await updateApplicantStatusAction(applicantId, "rejected")
    router.refresh()
    setLoading(false)
  }

  if (currentStatus === "hired" || currentStatus === "rejected") return null

  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-xl text-red-500 hover:bg-red-500/5"
        onClick={reject}
        disabled={loading}
      >
        <XCircle className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-xl text-green-600 hover:bg-green-600/5"
        onClick={advance}
        disabled={loading}
      >
        <CheckCircle2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

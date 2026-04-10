"use client"

import { ErrorState } from "@/components/ui/error-state"
import { useEffect } from "react"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Auth error:", error)
  }, [error])

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl p-8">
      <ErrorState
        title="Authentication error"
        description="Something went wrong. Please try again."
        onRetry={reset}
        redirectHref="/signin"
        redirectLabel="Back to sign in"
      />
    </div>
  )
}

"use client"

import { ErrorState } from "@/components/ui/error-state"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <>
      <ErrorState onRetry={reset} />
      {error.digest && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Error ID: {error.digest}
        </p>
      )}
    </>
  )
}

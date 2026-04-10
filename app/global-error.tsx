"use client"

import { ErrorState } from "@/components/ui/error-state"
import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <ErrorState
            title="Something went wrong"
            description="We apologize for the inconvenience. Our team has been notified and is working to fix the issue."
            onRetry={reset}
            redirectHref="/"
            redirectLabel="Go home"
          />
        </div>
      </body>
    </html>
  )
}

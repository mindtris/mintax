"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  redirectHref?: string
  redirectLabel?: string
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again or contact support if the issue persists.",
  onRetry,
  retryLabel = "Try again",
  redirectHref = "/dashboard",
  redirectLabel = "Go to dashboard",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
        <AlertTriangle className="w-5 h-5 text-destructive" />
      </div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground max-w-sm text-center">
        {description}
      </p>
      <div className="flex gap-3 mt-1">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            {retryLabel}
          </Button>
        )}
        <Button size="sm" onClick={() => (window.location.href = redirectHref)}>
          {redirectLabel}
        </Button>
      </div>
    </div>
  )
}

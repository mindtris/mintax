"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

type Props = {
  baseUrl: string | null
}

export default function CalendarSettingsView({ baseUrl }: Props) {
  const dashboardUrl = useMemo(() => {
    if (!baseUrl) return null
    return `${baseUrl.replace(/\/+$/, "")}/event-types`
  }, [baseUrl])

  if (!baseUrl || !dashboardUrl) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage availability, event types, and booking pages.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-base font-semibold">Not configured</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set <code className="text-xs">NEXT_PUBLIC_CALCOM_BASE_URL</code> in <code className="text-xs">.env</code> to
            the URL of your self-hosted cal.diy instance
            (for example <code className="text-xs">https://cal.example.com</code>), then restart the server.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage availability, event types, booking pages, and calendar connections.
            Bookings flow back into mintax automatically.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1.5" />
            Open in new tab
          </a>
        </Button>
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <iframe
          src={dashboardUrl}
          title="cal.diy"
          className="w-full border-0 h-[calc(100vh-240px)] min-h-[600px]"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  )
}

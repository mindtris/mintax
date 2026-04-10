import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

// Consolidated daily cron for Vercel Hobby plan (1 cron job limit).
// Calls all individual cron endpoints sequentially.
//
// For Pro plan or K8s, use granular schedules instead:
//   overdue:           every hour
//   recurring:         daily at midnight
//   reconcile:         every 6 hours
//   publish-posts:     every 5 minutes
//   refresh-analytics: every 12 hours
//   reminders:         every 15 minutes
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = request.nextUrl.origin
  const headers: Record<string, string> = {}
  if (cronSecret) headers["Authorization"] = `Bearer ${cronSecret}`

  const endpoints = [
    "/api/cron/overdue",
    "/api/cron/recurring",
    "/api/cron/reconcile",
    "/api/cron/publish-posts",
    "/api/cron/refresh-analytics",
    "/api/reminders/process",
  ]

  const results: Record<string, string> = {}

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, { headers })
      results[endpoint] = res.ok ? "ok" : `error: ${res.status}`
    } catch (err: any) {
      results[endpoint] = `failed: ${err.message}`
    }
  }

  return NextResponse.json({ results })
}

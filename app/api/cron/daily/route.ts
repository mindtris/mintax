import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

/**
 * Consolidated daily cron for Vercel Hobby plan (1 cron job limit).
 * Calls all individual cron endpoints sequentially.
 *
 * For Pro plan or K8s, use granular schedules instead:
 *   overdue:           0 * * * *       (hourly)
 *   recurring:         0 0 * * *       (daily)
 *   reconcile:         0 */6 * * *     (every 6h)
 *   publish-posts:     */5 * * * *     (every 5m)
 *   refresh-analytics: 0 */12 * * *    (every 12h)
 *   reminders:         */15 * * * *    (every 15m)
 */
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

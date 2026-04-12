import { processDueSchedules } from "@/lib/services/schedules"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await processDueSchedules()

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Schedule processing error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

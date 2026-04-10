import { processDueRecurringTransactions } from "@/lib/services/recurring-transactions"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const created = await processDueRecurringTransactions()

    return NextResponse.json({
      transactionsCreated: created,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Recurring transactions error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

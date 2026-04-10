import { prisma } from "@/lib/core/db"
import { batchReconcile } from "@/lib/services/automation"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all active bank accounts across all orgs
    const accounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      select: { id: true, organizationId: true, name: true },
    })

    let totalMatched = 0
    const results: Array<{ account: string; matched: number }> = []

    for (const account of accounts) {
      const matched = await batchReconcile(account.organizationId, account.id, 80)
      if (matched > 0) {
        results.push({ account: account.name, matched })
        totalMatched += matched
      }
    }

    return NextResponse.json({
      totalMatched,
      accounts: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Batch reconciliation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

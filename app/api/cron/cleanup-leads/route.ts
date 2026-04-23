import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/core/db"
import { logger } from "@/lib/logging/logger"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const result = await prisma.lead.deleteMany({
    where: {
      confirmationToken: { not: null },
      confirmedAt: null,
      confirmationTokenExpiresAt: { lt: now },
    },
  })

  logger.info("CRON", `cleanup-leads removed ${result.count} expired unconfirmed leads`)
  return NextResponse.json({ deleted: result.count })
}

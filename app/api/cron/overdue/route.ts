import { prisma } from "@/lib/core/db"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Mark overdue invoices
    const overdueInvoices = await prisma.invoice.updateMany({
      where: {
        status: { in: ["sent", "pending", "draft"] },
        dueAt: { not: null, lt: now },
      },
      data: { status: "overdue" },
    })

    // Mark overdue bills
    const overdueBills = await prisma.bill.updateMany({
      where: {
        status: { in: ["pending", "draft"] },
        dueAt: { not: null, lt: now },
      },
      data: { status: "overdue" },
    })

    return NextResponse.json({
      invoicesUpdated: overdueInvoices.count,
      billsUpdated: overdueBills.count,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("Error updating overdue status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

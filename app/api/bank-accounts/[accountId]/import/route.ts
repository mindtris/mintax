"use server"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { prisma } from "@/lib/core/db"
import { parseCSVBankStatement } from "@/lib/services/automation"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const { accountId } = await params
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    // Verify account belongs to org
    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, organizationId: org.id },
    })
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const csvContent = await file.text()
    const entries = parseCSVBankStatement(csvContent)

    if (entries.length === 0) {
      return NextResponse.json({ error: "No valid entries found in CSV. Check format: date, description, amount columns required." }, { status: 400 })
    }

    // Determine period from entries
    const dates = entries.map((e) => e.date).sort((a, b) => a.getTime() - b.getTime())
    const periodStart = dates[0]
    const periodEnd = dates[dates.length - 1]

    // Create bank statement
    const statement = await prisma.bankStatement.create({
      data: {
        bankAccountId: accountId,
        periodStart,
        periodEnd,
      },
    })

    // Create bank entries
    await prisma.bankEntry.createMany({
      data: entries.map((entry) => ({
        statementId: statement.id,
        date: entry.date,
        description: entry.description,
        amount: entry.amount,
        balance: entry.balance || null,
        reference: entry.reference || null,
        status: "unmatched",
      })),
    })

    // Update account balance to latest entry balance if available
    const lastEntry = entries[entries.length - 1]
    if (lastEntry.balance !== undefined) {
      await prisma.bankAccount.update({
        where: { id: accountId },
        data: { currentBalance: lastEntry.balance },
      })
    }

    return NextResponse.json({
      success: true,
      statementId: statement.id,
      entriesImported: entries.length,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    })
  } catch (error) {
    console.error("CSV import error:", error)
    return NextResponse.json({ error: "Failed to import statement" }, { status: 500 })
  }
}

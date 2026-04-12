import { prisma } from "@/lib/core/db"
import { sendBillReminderEmail, sendInvoiceReminderEmail } from "@/lib/integrations/email"
import { getSettings, getSettingsBatch } from "@/lib/services/settings"
import { format } from "date-fns"
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

    // ── Send overdue invoice reminders to admins ────────────────────────
    let invoiceEmailsSent = 0
    if (overdueInvoices.count > 0) {
      const invoices = await prisma.invoice.findMany({
        where: { status: "overdue" },
        include: {
          organization: {
            include: {
              members: {
                where: { role: { in: ["owner", "admin"] } },
                include: { user: { select: { email: true } } },
              },
            },
          },
        },
      })

      const invoiceOrgIds = Array.from(new Set(invoices.map((i) => i.organizationId)))
      const allInvoiceSettings = await getSettingsBatch(invoiceOrgIds)

      for (const invoice of invoices) {
        const emailSettings = allInvoiceSettings[invoice.organizationId] || {}
        const adminEmails = invoice.organization.members.map((m) => m.user.email)

        for (const adminEmail of adminEmails) {
          try {
            await sendInvoiceReminderEmail({
              email: adminEmail,
              invoiceNumber: invoice.invoiceNumber,
              clientName: invoice.clientName,
              total: (invoice.total / 100).toFixed(2),
              currency: invoice.currency,
              dueDate: invoice.dueAt ? format(invoice.dueAt, "MMMM d, yyyy") : "Not specified",
              orgName: invoice.organization.name,
              status: "overdue",
              recipient: "admin",
              emailSettings,
            })
            invoiceEmailsSent++
          } catch (error) {
            console.error(`Failed to send overdue invoice email for ${invoice.invoiceNumber}:`, error)
          }
        }

        // Also send to customer if they have an email
        if (invoice.clientEmail) {
          try {
            await sendInvoiceReminderEmail({
              email: invoice.clientEmail,
              invoiceNumber: invoice.invoiceNumber,
              clientName: invoice.clientName,
              total: (invoice.total / 100).toFixed(2),
              currency: invoice.currency,
              dueDate: invoice.dueAt ? format(invoice.dueAt, "MMMM d, yyyy") : "Not specified",
              orgName: invoice.organization.name,
              status: "overdue",
              recipient: "customer",
              emailSettings,
            })
            invoiceEmailsSent++
          } catch (error) {
            console.error(`Failed to send overdue invoice email to customer for ${invoice.invoiceNumber}:`, error)
          }
        }
      }
    }

    // ── Send overdue bill reminders to admins ───────────────────────────
    let billEmailsSent = 0
    if (overdueBills.count > 0) {
      const bills = await prisma.bill.findMany({
        where: { status: "overdue" },
        include: {
          organization: {
            include: {
              members: {
                where: { role: { in: ["owner", "admin"] } },
                include: { user: { select: { email: true } } },
              },
            },
          },
        },
      })

      const billOrgIds = Array.from(new Set(bills.map((b) => b.organizationId)))
      const allBillSettings = await getSettingsBatch(billOrgIds)

      for (const bill of bills) {
        const emailSettings = allBillSettings[bill.organizationId] || {}
        const adminEmails = bill.organization.members.map((m) => m.user.email)

        for (const adminEmail of adminEmails) {
          try {
            await sendBillReminderEmail({
              email: adminEmail,
              billNumber: bill.billNumber,
              vendorName: bill.vendorName,
              total: (bill.total / 100).toFixed(2),
              currency: bill.currency,
              dueDate: bill.dueAt ? format(bill.dueAt, "MMMM d, yyyy") : "Not specified",
              orgName: bill.organization.name,
              status: "overdue",
              emailSettings,
            })
            billEmailsSent++
          } catch (error) {
            console.error(`Failed to send overdue bill email for ${bill.billNumber}:`, error)
          }
        }
      }
    }

    return NextResponse.json({
      invoicesUpdated: overdueInvoices.count,
      billsUpdated: overdueBills.count,
      invoiceEmailsSent,
      billEmailsSent,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("Error updating overdue status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

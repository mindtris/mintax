import { prisma } from "@/lib/core/db"
import { sendReminderNotificationEmail } from "@/lib/integrations/email"
import { getDueRemindersForNotification, markEmailSent } from "@/lib/services/reminders"
import { format } from "date-fns"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const reminders = await getDueRemindersForNotification()
    const now = new Date()
    let sent = 0
    let skipped = 0

    for (const reminder of reminders) {
      // Check if it's time to send based on emailNotifyMinutesBefore
      const notifyAt = new Date(reminder.dueAt.getTime() - reminder.emailNotifyMinutesBefore * 60 * 1000)
      if (now < notifyAt) {
        skipped++
        continue
      }

      // Get assignee emails
      const userIds = reminder.assignees.map((a) => a.userId)
      if (userIds.length === 0) {
        // If no assignees, send to the creator
        userIds.push(reminder.createdById)
      }

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true },
      })

      const orgName = (reminder as any).organization?.name || "Your Organization"

      // Send email to each assignee
      for (const user of users) {
        try {
          await sendReminderNotificationEmail({
            email: user.email,
            reminderTitle: reminder.title,
            description: reminder.description,
            dueAt: format(reminder.dueAt, "MMMM d, yyyy 'at' h:mm a"),
            category: reminder.category,
            priority: reminder.priority,
            orgName,
          })
          sent++
        } catch (error) {
          console.error(`Failed to send reminder email to ${user.email}:`, error)
        }
      }

      // Mark as sent (atomically with WHERE emailSentAt IS NULL to prevent duplicates)
      await prisma.reminder.updateMany({
        where: { id: reminder.id, emailSentAt: null },
        data: { emailSentAt: new Date() },
      })
    }

    return NextResponse.json({
      processed: reminders.length,
      sent,
      skipped,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("Error processing reminders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

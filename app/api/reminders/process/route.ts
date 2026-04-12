import { prisma } from "@/lib/core/db"
import { sendReminderNotificationEmail } from "@/lib/integrations/email"
import { getDueRemindersForNotification, markEmailSent } from "@/lib/services/reminders"
import { getSettings, getSettingsBatch } from "@/lib/services/settings"
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

    const allUserIds = Array.from(
      new Set(
        reminders.flatMap((r) => {
          const ids = r.assignees.map((a) => a.userId)
          if (ids.length === 0) ids.push(r.createdById)
          return ids
        })
      )
    )

    const [allSettings, allUsers] = await Promise.all([
      getSettingsBatch(Array.from(new Set(reminders.map((r: any) => r.organizationId).filter(Boolean)))),
      prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, email: true },
      }),
    ])

    const usersMap = allUsers.reduce((acc, u) => {
      acc[u.id] = u.email
      return acc
    }, {} as Record<string, string>)

    for (const reminder of reminders) {
      // Check if it's time to send based on emailNotifyMinutesBefore
      const notifyAt = new Date(reminder.dueAt.getTime() - reminder.emailNotifyMinutesBefore * 60 * 1000)
      if (now < notifyAt) {
        skipped++
        continue
      }

      const orgId = (reminder as any).organizationId
      const orgName = (reminder as any).organization?.name || "Your Organization"
      const emailSettings = orgId ? allSettings[orgId] : undefined

      // Get assignee emails
      const userIds = reminder.assignees.map((a) => a.userId)
      if (userIds.length === 0) {
        userIds.push(reminder.createdById)
      }

      // Send email to each assignee
      for (const userId of userIds) {
        const email = usersMap[userId]
        if (!email) continue

        try {
          await sendReminderNotificationEmail({
            email,
            reminderTitle: reminder.title,
            description: reminder.description,
            dueAt: format(reminder.dueAt, "MMMM d, yyyy 'at' h:mm a"),
            category: reminder.category,
            priority: reminder.priority,
            orgName,
            emailSettings,
          })
          sent++
        } catch (error) {
          console.error(`Failed to send reminder email to ${email}:`, error)
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

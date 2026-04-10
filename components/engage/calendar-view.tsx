import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getScheduledPosts } from "@/lib/services/social-posts"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { CalendarGrid } from "./calendar-grid"
import { CalendarNav } from "./calendar-nav"

export async function CalendarView({ month }: { month?: string }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const now = new Date()
  const target = month ? new Date(month + "-01") : now
  const monthStart = startOfMonth(target)
  const monthEnd = endOfMonth(target)
  const currentMonth = format(target, "yyyy-MM")

  const posts = await getScheduledPosts(org.id, monthStart, monthEnd)

  const serializedPosts = posts.map((p) => ({
    id: p.id,
    content: p.content,
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toISOString() : null,
  }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Calendar</h1>
          <span className="text-sm text-muted-foreground">{format(target, "MMMM yyyy")}</span>
        </div>
        <CalendarNav currentMonth={currentMonth} />
      </header>

      <CalendarGrid
        posts={serializedPosts}
        monthStart={monthStart.toISOString()}
        monthEnd={monthEnd.toISOString()}
      />
    </div>
  )
}

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getOrgMembers } from "@/lib/services/organizations"
import { getReminders, ReminderFilters } from "@/lib/services/reminders"
import { RemindersViewClient } from "./reminders-view-client"

export async function RemindersView({ searchParams }: { searchParams: ReminderFilters & { page?: string } }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const currentPage = Math.max(1, parseInt(searchParams?.page || "1") || 1)
  const pageSize = 50
  const reminders = await getReminders(org.id, searchParams, { take: pageSize, skip: (currentPage - 1) * pageSize })
  const members = await getOrgMembers(org.id)

  return (
    <RemindersViewClient
      reminders={reminders.items}
      members={members}
      currentUserId={user.id}
      count={reminders.total}
    />
  )
}

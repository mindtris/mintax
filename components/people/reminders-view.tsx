import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getOrgMembers } from "@/lib/services/organizations"
import { getReminders, ReminderFilters } from "@/lib/services/reminders"
import { RemindersViewClient } from "./reminders-view-client"

export async function RemindersView({ searchParams }: { searchParams: ReminderFilters }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const reminders = await getReminders(org.id, searchParams)
  const members = await getOrgMembers(org.id)

  return (
    <RemindersViewClient
      reminders={reminders}
      members={members}
      currentUserId={user.id}
      count={reminders.length}
    />
  )
}

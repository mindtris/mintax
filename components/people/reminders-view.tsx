import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getOrgMembers } from "@/lib/services/organizations"
import { getReminders, ReminderFilters } from "@/lib/services/reminders"
import { getCategoriesByType } from "@/lib/services/categories"
import { seedReminderDefaults } from "@/lib/services/defaults"
import { RemindersViewClient } from "./reminders-view-client"

export async function RemindersView({ searchParams }: { searchParams: ReminderFilters & { page?: string } }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const currentPage = Math.max(1, parseInt(searchParams?.page || "1") || 1)
  const pageSize = 50
  
  let [reminders, members, categories] = await Promise.all([
    getReminders(org.id, searchParams, { take: pageSize, skip: (currentPage - 1) * pageSize }),
    getOrgMembers(org.id),
    getCategoriesByType(org.id, "reminder")
  ])

  // Auto-seed if missing
  if (categories.length === 0) {
    await seedReminderDefaults(org.id)
    categories = await getCategoriesByType(org.id, "reminder")
  }

  return (
    <RemindersViewClient
      reminders={reminders.items}
      members={members}
      categories={categories}
      currentUserId={user.id}
      count={reminders.total}
    />
  )
}

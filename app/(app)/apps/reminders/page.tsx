import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getOrgMembers } from "@/lib/services/organizations"
import { getReminders, ReminderFilters } from "@/lib/services/reminders"
import { RemindersPage } from "./components/reminders-page"
import { manifest } from "./manifest"

export default async function RemindersApp({ searchParams }: { searchParams: Promise<ReminderFilters & { page?: string }> }) {
  const filters = await searchParams
  const currentPage = Math.max(1, parseInt(filters.page || "1") || 1)
  const pageSize = 50
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { items: reminders, total: totalCount } = await getReminders(org.id, filters, { take: pageSize, skip: (currentPage - 1) * pageSize })
  const members = await getOrgMembers(org.id)

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.name}
          </span>
          <span className="text-3xl tracking-tight opacity-20">{totalCount}</span>
        </h2>
      </header>
      <RemindersPage reminders={reminders} members={members} currentUserId={user.id} />
    </div>
  )
}

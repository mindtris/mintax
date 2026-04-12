import ScheduleSettingsView from "@/components/settings/schedule-settings-view"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSchedules } from "@/lib/services/schedules"

export default async function ScheduleSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const schedules = await getSchedules(org.id)

  return (
    <ScheduleSettingsView schedules={schedules} />
  )
}

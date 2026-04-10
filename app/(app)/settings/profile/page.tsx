import ProfileSettingsForm from "@/components/settings/profile-settings-form"
import { getCurrentUser } from "@/lib/core/auth"

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Profile & plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile and subscription details.
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <ProfileSettingsForm user={user} />
      </div>
    </div>
  )
}

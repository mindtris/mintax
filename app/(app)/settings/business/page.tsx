import BusinessSettingsForm from "@/components/settings/business-settings-form"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"

export default async function BusinessSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Business details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your organization structure, fiscal year, and default currency.
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <BusinessSettingsForm org={org} user={user} />
      </div>
    </div>
  )
}

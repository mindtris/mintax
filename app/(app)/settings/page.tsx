import GlobalSettingsForm from "@/components/settings/global-settings-form"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCategories } from "@/lib/services/categories"
import { getCurrencies } from "@/lib/services/currencies"
import { getSettings } from "@/lib/services/settings"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const settings = await getSettings(org.id)
  const currencies = await getCurrencies(org.id)
  const categories = await getCategories(org.id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">General</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your organization's core financial behaviors, defaults, and automated AI analysis prompts.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <GlobalSettingsForm settings={settings} currencies={currencies} categories={categories} />
      </div>
    </div>
  )
}

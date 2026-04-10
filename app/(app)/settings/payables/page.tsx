import PayablesSettingsForm from "@/components/settings/payables-settings-form"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCategories } from "@/lib/services/categories"
import { getSettings } from "@/lib/services/settings"

export default async function PayablesSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const settings = await getSettings(org.id)
  const categories = await getCategories(org.id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Payables</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure bill prefixes, payment terms, and payable defaults.
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <PayablesSettingsForm settings={settings} categories={categories} />
      </div>
    </div>
  )
}

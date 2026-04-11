import EmailTemplateSettingsForm from "@/components/settings/email-template-settings-form"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSettings } from "@/lib/services/settings"

export default async function EmailTemplatesSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const settings = await getSettings(org.id)

  return (
    <EmailTemplateSettingsForm settings={settings} orgName={org.name} />
  )
}

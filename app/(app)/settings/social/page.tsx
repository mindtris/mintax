import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialAccounts } from "@/lib/services/social-accounts"
import { SocialAccountsList } from "./social-list"
import { ConnectAccountButton } from "./connect-button"

export default async function SocialSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const accounts = await getSocialAccounts(org.id)

  const rows = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    provider: a.provider,
    username: a.username,
    disabled: a.disabled,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Social accounts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your social media accounts to publish and schedule posts.
          </p>
        </div>
        <ConnectAccountButton />
      </div>

      <SocialAccountsList accounts={rows} />
    </div>
  )
}

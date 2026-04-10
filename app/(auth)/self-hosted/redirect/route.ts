import config from "@/lib/core/config"
import { createOrgDefaults, isOrgEmpty } from "@/lib/services/defaults"
import { getOrganizationsForUser } from "@/lib/services/organizations"
import { getOrCreateSelfHostedUser } from "@/lib/services/users"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function GET() {
  if (!config.selfHosted.isEnabled) {
    redirect(config.auth.loginUrl)
  }

  // Ensure user + org exist
  const user = await getOrCreateSelfHostedUser()

  const orgs = await getOrganizationsForUser(user.id)
  const orgId = orgs[0]?.id

  if (orgId && await isOrgEmpty(orgId)) {
    await createOrgDefaults(orgId)
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

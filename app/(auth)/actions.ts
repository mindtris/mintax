"use server"

import { createOrgDefaults, isOrgEmpty } from "@/lib/services/defaults"
import { createOrganization, getOrganizationsForUser, updateOrganization } from "@/lib/services/organizations"
import { updateSettings } from "@/lib/services/settings"
import { getOrCreateSelfHostedUser } from "@/lib/services/users"
import { getCurrentUser } from "@/lib/core/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function selfHostedGetStartedAction(formData: FormData) {
  const user = await getOrCreateSelfHostedUser()

  // Get the user's first org (created during getOrCreateSelfHostedUser)
  const orgs = await getOrganizationsForUser(user.id)
  const orgId = orgs[0]?.id

  if (orgId && await isOrgEmpty(orgId)) {
    await createOrgDefaults(orgId)
  }

  const apiKeys = [
    "openai_api_key",
    "google_api_key",
    "mistral_api_key",
    "openai_compatible_api_key",
    "openai_compatible_base_url",
  ]

  for (const key of apiKeys) {
    const value = formData.get(key)
    if (value && orgId) {
      await updateSettings(orgId, key, value as string)
    }
  }

  const defaultCurrency = formData.get("default_currency")
  if (defaultCurrency && orgId) {
    await updateSettings(orgId, "default_currency", defaultCurrency as string)
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function setupOrganizationAction(formData: FormData) {
  const user = await getCurrentUser()
  
  const name = formData.get("name") as string
  const type = formData.get("type") as string || "business"
  const baseCurrency = formData.get("baseCurrency") as string || "INR"
  const taxId = formData.get("taxId") as string
  const fiscalYearStart = formData.get("fiscalYearStart") as string

  if (!name) {
    throw new Error("Company name is required")
  }

  // 1. Create the organization
  const org = await createOrganization(user.id, {
    name,
    type,
    baseCurrency,
    taxId
  })

  // 2. Update additional settings if provided
  if (fiscalYearStart) {
    await updateSettings(org.id, "fiscal_year_start", fiscalYearStart)
  }

  // 3. Revalidate and redirect
  revalidatePath("/dashboard")
  redirect("/dashboard")
}

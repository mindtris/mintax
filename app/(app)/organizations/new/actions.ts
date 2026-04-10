"use server"

import { getCurrentUser, setActiveOrg } from "@/lib/core/auth"
import { createOrganization } from "@/lib/services/organizations"
import { redirect } from "next/navigation"

export async function createOrganizationAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()

  const name = formData.get("name") as string
  const type = formData.get("type") as string
  const baseCurrency = formData.get("baseCurrency") as string
  const taxId = formData.get("taxId") as string
  const address = formData.get("address") as string

  if (!name || name.trim().length < 2) {
    return { error: "Organization name must be at least 2 characters" }
  }

  const org = await createOrganization(user.id, {
    name: name.trim(),
    type,
    baseCurrency,
    taxId: taxId || undefined,
    address: address || undefined,
  })

  await setActiveOrg(org.id)
  redirect("/dashboard")
}

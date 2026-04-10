"use server"

import { getCurrentUser, setActiveOrg } from "@/lib/core/auth"
import { createOrganization } from "@/lib/services/organizations"
import { redirect } from "next/navigation"

export async function setupOrganizationAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()

  const name = formData.get("name") as string
  const type = formData.get("type") as string
  const baseCurrency = formData.get("baseCurrency") as string
  const fiscalYearStart = parseInt(formData.get("fiscalYearStart") as string, 10) || 1
  const taxId = formData.get("taxId") as string
  const address = formData.get("address") as string
  const bankDetails = formData.get("bankDetails") as string

  if (!name || name.trim().length < 2) {
    return { error: "Organization name must be at least 2 characters" }
  }

  const org = await createOrganization(user.id, {
    name: name.trim(),
    type: type || "business",
    baseCurrency: baseCurrency || "INR",
    taxId: taxId || undefined,
    address: address || undefined,
  })

  // Update fiscal year and bank details if provided
  if (fiscalYearStart !== 1 || bankDetails) {
    const { prisma } = await import("@/lib/core/db")
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        fiscalYearStart,
        bankDetails: bankDetails || undefined,
      },
    })
  }

  await setActiveOrg(org.id)
  redirect("/dashboard")
}

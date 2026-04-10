"use server"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { disableSocialAccount, deleteSocialAccount } from "@/lib/services/social-accounts"
import { revalidatePath } from "next/cache"

export async function disableSocialAccountAction(accountId: string, disable: boolean) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  if (disable) {
    await disableSocialAccount(accountId, org.id)
  } else {
    // Re-enable by updating disabled to false
    const { prisma } = await import("@/lib/core/db")
    await prisma.socialAccount.update({
      where: { id: accountId, organizationId: org.id },
      data: { disabled: false },
    })
  }

  revalidatePath("/settings/social")
}

export async function deleteSocialAccountAction(accountId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  await deleteSocialAccount(accountId, org.id)
  revalidatePath("/settings/social")
}

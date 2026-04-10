"use server"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { createRecurringTransaction, deleteRecurringTransaction, toggleRecurringTransaction } from "@/lib/services/recurring-transactions"
import { revalidatePath } from "next/cache"

export async function createRecurringAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const name = formData.get("name") as string
  if (!name || name.trim().length < 2) {
    return { error: "Name is required" }
  }

  try {
    await createRecurringTransaction(org.id, user.id, {
      name,
      merchant: formData.get("merchant") as string || undefined,
      total: Math.round(parseFloat(formData.get("total") as string || "0") * 100),
      currencyCode: formData.get("currencyCode") as string || org.baseCurrency,
      type: formData.get("type") as string || "expense",
      categoryCode: formData.get("categoryCode") as string || undefined,
      note: formData.get("note") as string || undefined,
      recurrence: formData.get("recurrence") as string || "monthly",
      nextRunAt: new Date(formData.get("nextRunAt") as string),
      endAt: formData.get("endAt") ? new Date(formData.get("endAt") as string) : undefined,
    })

    revalidatePath("/transactions/recurring")
    return { success: true }
  } catch (error) {
    return { error: "Failed to create recurring transaction" }
  }
}

export async function deleteRecurringAction(id: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  await deleteRecurringTransaction(id, org.id)
  revalidatePath("/transactions/recurring")
  return { success: true }
}

export async function toggleRecurringAction(id: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  await toggleRecurringTransaction(id, org.id)
  revalidatePath("/transactions/recurring")
  return { success: true }
}

"use server"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { createBankAccount, type BankAccountData } from "@/lib/services/bank-accounts"
import { revalidatePath } from "next/cache"

/**
 * Lightweight "quick add" server action used by the inline bank-account
 * sheet inside the transaction create form. Returns the created entity so
 * the caller can append to local state and auto-select the new row without
 * a full page refresh or tab switch.
 */
export async function quickAddBankAccountAction(data: BankAccountData) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const account = await createBankAccount(org.id, data)
    revalidatePath("/accounts")
    return { success: true as const, data: account }
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to create bank account" }
  }
}

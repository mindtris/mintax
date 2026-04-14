"use server"

import { deleteContact } from "@/lib/services/contacts"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { revalidatePath } from "next/cache"

export async function deleteContactAction(contactId: string) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    
    await deleteContact(org.id, contactId)
    
    revalidatePath("/sales")
    revalidatePath("/customers")
    revalidatePath("/customers/clients")
    revalidatePath("/customers/vendors")
    
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete contact:", error)
    return { success: false, error: error.message || "Failed to delete contact" }
  }
}

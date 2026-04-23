"use server"

import { ActionState } from "@/lib/actions"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import {
  createLead,
  updateLead,
  deleteLead,
  updateLeadStage,
  convertLeadToContact,
} from "@/lib/services/leads"
import { listMeetingsForLead } from "@/lib/services/meetings"
import { revalidatePath } from "next/cache"

export async function getLeadMeetingsAction(leadId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  return listMeetingsForLead(org.id, leadId)
}

export async function createLeadAction(
  _prevState: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const raw = Object.fromEntries(formData.entries())

    const lead = await createLead(org.id, {
      title: raw.title as string,
      contactName: raw.contactName as string,
      email: (raw.email as string) || null,
      phone: (raw.phone as string) || null,
      company: (raw.company as string) || null,
      stage: (raw.stage as string) || "new",
      source: (raw.source as string) || null,
      value: raw.value ? Math.round(parseFloat(raw.value as string) * 100) : 0,
      currency: (raw.currency as string) || "INR",
      probability: raw.probability ? parseInt(raw.probability as string, 10) : 0,
      description: (raw.description as string) || null,
      expectedCloseAt: (raw.expectedCloseAt as string) || null,
    })

    revalidatePath("/sales")
    return { success: true, data: lead }
  } catch (error) {
    console.error("Failed to create lead:", error)
    return { success: false, error: "Failed to create lead" }
  }
}

export async function updateLeadAction(
  _prevState: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const leadId = formData.get("leadId") as string
    const raw = Object.fromEntries(formData.entries())

    const lead = await updateLead(leadId, org.id, {
      title: raw.title as string,
      contactName: raw.contactName as string,
      email: (raw.email as string) || null,
      phone: (raw.phone as string) || null,
      company: (raw.company as string) || null,
      stage: (raw.stage as string) || undefined,
      source: (raw.source as string) || null,
      value: raw.value ? Math.round(parseFloat(raw.value as string) * 100) : undefined,
      probability: raw.probability ? parseInt(raw.probability as string, 10) : undefined,
      description: (raw.description as string) || null,
      expectedCloseAt: (raw.expectedCloseAt as string) || null,
    })

    revalidatePath("/sales")
    return { success: true, data: lead }
  } catch (error) {
    console.error("Failed to update lead:", error)
    return { success: false, error: "Failed to update lead" }
  }
}

export async function deleteLeadAction(leadId: string): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    await deleteLead(leadId, org.id)
    revalidatePath("/sales")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete lead:", error)
    return { success: false, error: "Failed to delete lead" }
  }
}

export async function updateLeadStageAction(leadId: string, stage: string): Promise<ActionState<any>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const lead = await updateLeadStage(leadId, org.id, stage)
    revalidatePath("/sales")
    return { success: true, data: lead }
  } catch (error) {
    console.error("Failed to update lead stage:", error)
    return { success: false, error: "Failed to update stage" }
  }
}

export async function convertLeadAction(leadId: string): Promise<ActionState<any>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const contact = await convertLeadToContact(leadId, org.id)
    revalidatePath("/sales")
    return { success: true, data: contact }
  } catch (error) {
    console.error("Failed to convert lead:", error)
    return { success: false, error: "Failed to convert lead to contact" }
  }
}

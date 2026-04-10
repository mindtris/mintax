"use server"

import { ActionState } from "@/lib/actions"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { reminderFormSchema } from "@/lib/schemas/reminders"
import {
  completeReminder,
  createReminder,
  deleteRecurrenceSeries,
  deleteReminder,
  updateReminder,
} from "@/lib/services/reminders"
import { Reminder } from "@/lib/prisma/client"
import { revalidatePath } from "next/cache"

export async function createReminderAction(
  _prevState: ActionState<Reminder> | null,
  formData: FormData
): Promise<ActionState<Reminder>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const raw = Object.fromEntries(formData.entries())

    // Handle assigneeUserIds from formData (multiple values)
    const assigneeUserIds = formData.getAll("assigneeUserIds").map(String).filter(Boolean)
    const parsed = reminderFormSchema.safeParse({ ...raw, assigneeUserIds })

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map((e) => e.message).join(", ") }
    }

    const reminder = await createReminder(org.id, user.id, parsed.data)

    revalidatePath("/people")
    revalidatePath("/dashboard")
    return { success: true, data: reminder }
  } catch (error) {
    console.error("Failed to create reminder:", error)
    return { success: false, error: "Failed to create reminder" }
  }
}

export async function updateReminderAction(
  _prevState: ActionState<Reminder> | null,
  formData: FormData
): Promise<ActionState<Reminder>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const reminderId = formData.get("reminderId") as string
    const raw = Object.fromEntries(formData.entries())

    const assigneeUserIds = formData.getAll("assigneeUserIds").map(String).filter(Boolean)
    const parsed = reminderFormSchema.safeParse({ ...raw, assigneeUserIds })

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map((e) => e.message).join(", ") }
    }

    const reminder = await updateReminder(reminderId, org.id, parsed.data)

    revalidatePath("/people")
    revalidatePath("/dashboard")
    return { success: true, data: reminder }
  } catch (error) {
    console.error("Failed to update reminder:", error)
    return { success: false, error: "Failed to update reminder" }
  }
}

export async function deleteReminderAction(reminderId: string): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    await deleteReminder(reminderId, org.id)

    revalidatePath("/people")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete reminder:", error)
    return { success: false, error: "Failed to delete reminder" }
  }
}

export async function completeReminderAction(reminderId: string): Promise<ActionState<Reminder>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const reminder = await completeReminder(reminderId, org.id)

    revalidatePath("/people")
    revalidatePath("/dashboard")
    return { success: true, data: reminder }
  } catch (error) {
    console.error("Failed to complete reminder:", error)
    return { success: false, error: "Failed to complete reminder" }
  }
}

export async function deleteSeriesAction(parentId: string): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    await deleteRecurrenceSeries(parentId, org.id)

    revalidatePath("/people")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete reminder series:", error)
    return { success: false, error: "Failed to delete reminder series" }
  }
}

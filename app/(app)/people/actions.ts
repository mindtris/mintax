"use server"

import { prisma } from "@/lib/core/db"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { addOrgMember, removeOrgMember, updateOrgMemberRole } from "@/lib/services/organizations"
import { getUserByEmail } from "@/lib/services/users"
import { revalidatePath } from "next/cache"

import { createQuicklink, deleteQuicklink, updateQuicklink } from "@/lib/services/quicklinks"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function inviteMemberAction(email: string, role: string) {
  try {
    if (!EMAIL_REGEX.test(email)) {
      return { success: false, error: "Please enter a valid email address" }
    }

    const admin = await getCurrentUser()
    const org = await getActiveOrg(admin)

    const user = await getUserByEmail(email)
    if (!user) {
      return { success: false, error: `No user found with email ${email}. Invite them to join Mintax first.` }
    }

    // Check if already a member
    const existingMembers = await prisma.orgMember.findMany({
      where: { organizationId: org.id },
    })
    
    if (existingMembers.some(m => m.userId === user.id)) {
      return { success: false, error: "This person is already a member of your organization" }
    }

    await addOrgMember(org.id, user.id, role)

    revalidatePath("/people")
    return { success: true }
  } catch (error) {
    console.error("Failed to invite member:", error)
    return { success: false, error: "Failed to invite member. Please check permissions." }
  }
}

export async function bulkRemoveMembersAction(userIds: string[]) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    let successCount = 0
    let failCount = 0

    for (const userId of userIds) {
      if (userId === user.id) continue 
      try {
        await removeOrgMember(org.id, userId)
        successCount++
      } catch (e) {
        failCount++
      }
    }

    revalidatePath("/people")
    if (failCount > 0) {
      return { success: false, error: `Removed ${successCount} members, but ${failCount} failed. Check permissions.` }
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to remove members:", error)
    return { success: false, error: "Failed to perform bulk removal." }
  }
}

export async function updateMemberRoleAction(userId: string, role: string) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    await updateOrgMemberRole(org.id, userId, role)

    revalidatePath("/people")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update member role" }
  }
}

export async function removeMemberAction(userId: string) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    if (userId === user.id) {
      return { success: false, error: "You cannot remove yourself" }
    }

    await removeOrgMember(org.id, userId)

    revalidatePath("/people")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to remove member" }
  }
}

// Quicklinks Actions
export async function createQuicklinkAction(data: { title: string; url: string; category?: string }) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    await createQuicklink(org.id, data)

    revalidatePath("/people")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to create quicklink" }
  }
}

export async function updateQuicklinkAction(id: string, data: { title: string; url: string; category?: string }) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    await updateQuicklink(org.id, id, data)

    revalidatePath("/people")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update quicklink" }
  }
}

export async function deleteQuicklinkAction(id: string) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    await deleteQuicklink(org.id, id)

    revalidatePath("/people")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete quicklink" }
  }
}

export async function bulkDeleteQuicklinksAction(ids: string[]) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    for (const id of ids) {
      await deleteQuicklink(org.id, id)
    }

    revalidatePath("/people")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete one or more quicklinks" }
  }
}

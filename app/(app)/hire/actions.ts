"use server"

import { revalidatePath } from "next/cache"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import * as jobsService from "@/lib/services/jobs"
import * as candidatesService from "@/lib/services/candidates"
import { getCandidateFilePath } from "@/lib/files"
import { uploadAndCreateFile, attachFileToCandidate } from "@/lib/services/files"

// ──────────────────────────────────────────────
// Talent Actions (Unified)
// ──────────────────────────────────────────────

export async function createCandidateAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const group = (formData.get("group") as "ATS" | "BENCH") || "ATS"
  const jobId = formData.get("jobId") as string || undefined
  const resumeFile = formData.get("resume") as File | null

  const data: candidatesService.CandidateInput = {
    organizationId: org.id,
    group,
    jobId,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string || undefined,
    linkedinUrl: formData.get("linkedinUrl") as string || undefined,
    sourcedFrom: formData.get("sourcedFrom") as string || undefined,
    workAuthorization: formData.get("workAuthorization") as string || undefined,
    status: "new",
    benchStatus: group === "BENCH" ? "available" : undefined,
    marketingBio: formData.get("marketingBio") as string || undefined,
    hourlyRate: formData.get("hourlyRate") ? parseInt(formData.get("hourlyRate") as string) : undefined,
    notes: formData.get("notes") as string || undefined,
  }

  if (!data.firstName || !data.lastName || !data.email) {
    return { error: "First name, last name, and email are required" }
  }

  try {
    const candidate = await candidatesService.createCandidate(data)

    // Upload resume via storage abstraction
    if (resumeFile && resumeFile.size > 0) {
      try {
        const { randomUUID } = await import("crypto")
        const storagePath = getCandidateFilePath(org.id, randomUUID(), resumeFile.name)
        const fileRecord = await uploadAndCreateFile(org.id, user.id, resumeFile, storagePath)
        await attachFileToCandidate(candidate.id, fileRecord.id, "resume")
      } catch (e) {
        console.error("Resume upload failed:", e)
      }
    }
    revalidatePath("/hire")
    revalidatePath("/hire/candidates")
    if (jobId) revalidatePath(`/hire/${jobId}/applicants`)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to add talent" }
  }
}

export async function updateTalentStatusAction(id: string, status: string, notes?: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  try {
    const candidate = await candidatesService.updateCandidate(id, { 
      status, 
      ...(notes ? { notes } : {}) 
    })
    revalidatePath("/hire")
    if (candidate.jobId) revalidatePath(`/hire/${candidate.jobId}/applicants`)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update status" }
  }
}

export async function updateBenchStatusAction(id: string, benchStatus: string) {
  const user = await getCurrentUser()
  await getActiveOrg(user)

  try {
    await candidatesService.updateCandidate(id, { benchStatus })
    revalidatePath("/hire/bench")
    return { success: true }
  } catch (error) {
    return { error: "Failed to update bench status" }
  }
}

// ──────────────────────────────────────────────
// Marketing / Submissions
// ──────────────────────────────────────────────

export async function submitToClientAction(candidateId: string, contactId: string, notes?: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  try {
    await candidatesService.submitToClient(org.id, candidateId, contactId, notes)
    revalidatePath("/hire/bench")
    return { success: true }
  } catch (error) {
    return { error: "Failed to submit profile" }
  }
}

// ──────────────────────────────────────────────
// Job Actions
// ──────────────────────────────────────────────

export async function createJobAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const data: jobsService.JobPostingInput = {
    organizationId: org.id,
    createdById: user.id,
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    requirements: formData.get("requirements") as string || undefined,
    status: formData.get("status") as string || "open",
    type: formData.get("type") as string || "permanent",
    experienceMin: formData.get("experienceMin") ? parseInt(formData.get("experienceMin") as string) : undefined,
    experienceMax: formData.get("experienceMax") ? parseInt(formData.get("experienceMax") as string) : undefined,
    salaryMin: formData.get("salaryMin") ? parseInt(formData.get("salaryMin") as string) : undefined,
    salaryMax: formData.get("salaryMax") ? parseInt(formData.get("salaryMax") as string) : undefined,
    currency: formData.get("currency") as string || "INR",
    categoryId: formData.get("categoryId") as string || undefined,
  }

  if (!data.title) return { error: "Title is required" }

  try {
    await jobsService.createJobPosting(data)
    revalidatePath("/hire")
    return { success: true }
  } catch (error) {
    return { error: "Failed to create job" }
  }
}

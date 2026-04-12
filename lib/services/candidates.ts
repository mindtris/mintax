import { prisma } from "@/lib/core/db"

export interface CandidateInput {
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  resumePath?: string
  linkedinUrl?: string
  portfolioUrl?: string
  sourcedFrom?: string
  workAuthorization?: string
  externalCandidateId?: string
  jobId?: string
  group?: "ATS" | "BENCH"
  status?: string
  benchStatus?: string
  marketingBio?: string
  hourlyRate?: number
  notes?: string
}

export async function getCandidates(organizationId: string, filters?: { jobId?: string; group?: string; search?: string; status?: string }, options?: { ordering?: string }) {
  const orderByMatch = options?.ordering?.match(/^-?(.+)$/)
  const orderByField = orderByMatch ? orderByMatch[1] : "createdAt"
  const orderDirection = options?.ordering?.startsWith("-") ? "desc" : "asc"

  return await prisma.candidate.findMany({
    where: { 
      organizationId,
      ...(filters?.jobId ? { jobId: filters.jobId } : {}),
      ...(filters?.group ? { group: filters.group as any } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search ? {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ]
      } : {}),
    },
    include: {
      job: true,
      submissions: {
        include: {
          contact: true
        }
      }
    },
    orderBy: { [orderByField]: orderDirection }
  })
}

export async function getCandidate(id: string) {
  return await prisma.candidate.findUnique({
    where: { id },
    include: {
      job: true,
      submissions: {
        include: {
          contact: true
        }
      }
    }
  })
}

export async function createCandidate(data: CandidateInput) {
  return await prisma.candidate.create({
    data
  })
}

export async function updateCandidate(id: string, data: Partial<CandidateInput>) {
  return await prisma.candidate.update({
    where: { id },
    data
  })
}

export async function deleteCandidate(id: string) {
  return await prisma.candidate.delete({
    where: { id }
  })
}

// Marketing / Bench Specific Logic
export async function submitToClient(organizationId: string, candidateId: string, contactId: string, notes?: string) {
  return await prisma.marketingSubmission.create({
    data: {
      organizationId,
      candidateId,
      contactId,
      status: "sent",
      notes
    }
  })
}

export async function updateSubmissionStatus(id: string, status: string, notes?: string) {
  return await prisma.marketingSubmission.update({
    where: { id },
    data: { 
      status,
      ...(notes ? { notes } : {})
    }
  })
}

export async function getCandidatePipeline(organizationId: string, jobId: string) {
  const [candidates, categories] = await Promise.all([
    prisma.candidate.findMany({
      where: { jobId, group: "ATS" },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.category.findMany({
      where: { organizationId, type: "applicant_status" },
      orderBy: { name: "asc" }
    })
  ])

  // Group by status dynamically based on current settings
  const pipeline: Record<string, any[]> = {}
  
  // Initialize buckets for all active statuses
  categories.forEach(cat => {
    if (cat.code) pipeline[cat.code] = []
  })

  // Fill buckets
  candidates.forEach(candidate => {
    const status = candidate.status || "unprocessed"
    if (!pipeline[status]) pipeline[status] = []
    pipeline[status].push(candidate)
  })

  return pipeline
}

export async function getBenchResources(organizationId: string) {
  return await prisma.candidate.findMany({
    where: { organizationId, group: "BENCH" },
    include: {
      submissions: {
        include: {
          contact: true
        }
      }
    },
    orderBy: { benchStatus: "asc" }
  })
}

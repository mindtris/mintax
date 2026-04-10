import { prisma } from "@/lib/core/db"

export interface JobPostingInput {
  organizationId: string
  createdById: string
  title: string
  description?: string
  requirements?: string
  status?: string
  type?: string
  experienceMin?: number
  experienceMax?: number
  salaryMin?: number
  salaryMax?: number
  currency?: string
  jobCategoryCode?: string
  categoryId?: string
  externalProviderId?: string
}

export async function getJobPostings(organizationId: string, filters?: { search?: string; status?: string }, options?: { ordering?: string }) {
  const orderByMatch = options?.ordering?.match(/^-?(.+)$/)
  const orderByField = orderByMatch ? orderByMatch[1] : "createdAt"
  const orderDirection = options?.ordering?.startsWith("-") ? "desc" : "asc"

  return await prisma.jobPosting.findMany({
    where: { 
      organizationId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search ? {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ]
      } : {}),
    },
    include: {
      category: true,
      _count: {
        select: { candidates: true }
      }
    },
    orderBy: { [orderByField]: orderDirection }
  })
}

export async function getJobPosting(id: string) {
  return await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      category: true,
      candidates: true,
      _count: {
        select: { candidates: true }
      }
    }
  })
}

export async function createJobPosting(data: JobPostingInput) {
  return await prisma.jobPosting.create({
    data
  })
}

export async function updateJobPosting(id: string, data: Partial<JobPostingInput>) {
  return await prisma.jobPosting.update({
    where: { id },
    data
  })
}

export async function deleteJobPosting(id: string) {
  return await prisma.jobPosting.delete({
    where: { id }
  })
}

export async function getJobAnalytics(organizationId: string) {
  const jobs = await prisma.jobPosting.findMany({
    where: { organizationId },
    select: {
      status: true,
      _count: {
        select: { candidates: true }
      }
    }
  })

  return {
    total: jobs.length,
    open: jobs.filter((j: any) => j.status === "open").length,
    draft: jobs.filter((j: any) => j.status === "draft").length,
    totalApplicants: jobs.reduce((sum: number, j: any) => sum + j._count.candidates, 0)
  }
}

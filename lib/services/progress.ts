import { prisma } from "@/lib/core/db"

export const getOrCreateProgress = async (
  orgId: string,
  userId: string,
  id: string,
  type: string | null = null,
  data: any = null,
  total: number = 0
) => {
  return await prisma.progress.upsert({
    where: { id },
    create: {
      id,
      organization: { connect: { id: orgId } },
      userId,
      type: type || "unknown",
      data,
      total,
    },
    update: {
      // Don't update existing progress
    },
  })
}

export const getProgressById = async (orgId: string, id: string) => {
  return await prisma.progress.findFirst({
    where: { id, organizationId: orgId },
  })
}

export const updateProgress = async (
  orgId: string,
  id: string,
  fields: { current?: number; total?: number; data?: any }
) => {
  return await prisma.progress.updateMany({
    where: { id, organizationId: orgId },
    data: fields,
  })
}

export const incrementProgress = async (orgId: string, id: string, amount: number = 1) => {
  return await prisma.progress.updateMany({
    where: { id, organizationId: orgId },
    data: {
      current: { increment: amount },
    },
  })
}

export const getAllProgressByOrg = async (orgId: string) => {
  return await prisma.progress.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  })
}

export const deleteProgress = async (orgId: string, id: string) => {
  return await prisma.progress.deleteMany({
    where: { id, organizationId: orgId },
  })
}

import { prisma } from "@/lib/core/db"

import { findOrCreateCategory } from "./categories"

export interface QuicklinkInput {
  title: string
  url: string
  category?: string
}

export async function getQuicklinks(orgId: string) {
  const quicklinks = await prisma.quicklink.findMany({
    where: {
      organizationId: orgId,
    },
    include: {
      category: true,
    },
    orderBy: { title: "asc" },
  })

  // Map backward to string proxy for UI
  return quicklinks.map(q => ({
    id: q.id,
    title: q.title,
    url: q.url,
    category: q.category?.name || "General"
  }))
}

export async function createQuicklink(orgId: string, data: QuicklinkInput) {
  // Leverage central Category schema polymorphically
  const categoryRecord = await findOrCreateCategory(orgId, "quicklink", data.category || "General")

  return await prisma.quicklink.create({
    data: {
      organizationId: orgId,
      title: data.title,
      url: data.url,
      categoryId: categoryRecord.id,
    },
  })
}

export async function updateQuicklink(orgId: string, quicklinkId: string, data: Partial<QuicklinkInput>) {
  // Verify ownership
  const existing = await prisma.quicklink.findFirst({
    where: { id: quicklinkId, organizationId: orgId }
  })

  if (!existing) throw new Error("Quicklink not found or unauthorized")

  const updateData: any = {
    title: data.title,
    url: data.url,
  }

  if (data.category) {
    const categoryRecord = await findOrCreateCategory(orgId, "quicklink", data.category)
    updateData.categoryId = categoryRecord.id
  }

  return await prisma.quicklink.update({
    where: { id: quicklinkId },
    data: updateData,
  })
}

export async function deleteQuicklink(orgId: string, quicklinkId: string) {
  // Verify ownership before deleting
  const link = await prisma.quicklink.findFirst({
    where: {
      id: quicklinkId,
      organizationId: orgId,
    },
  })

  if (!link) {
    throw new Error("Quicklink not found")
  }

  return await prisma.quicklink.delete({
    where: {
      id: quicklinkId,
    },
  })
}

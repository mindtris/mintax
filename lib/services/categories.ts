import { prisma } from "@/lib/core/db"

export async function getCategoriesByType(orgId: string, type: string) {
  return await prisma.category.findMany({
    where: {
      organizationId: orgId,
      type,
    },
    orderBy: { name: "asc" },
  })
}

export async function findOrCreateCategory(orgId: string, type: string, name: string) {
  const existing = await prisma.category.findFirst({
    where: {
      organizationId: orgId,
      type,
      name: {
        equals: name,
        mode: "insensitive", // Postgres insensitive match
      },
    },
  })

  if (existing) return existing

  return await prisma.category.create({
    data: {
      organizationId: orgId,
      type,
      name,
    },
  })
}

export async function getCategoryByCode(orgId: string, code: string) {
  return await prisma.category.findFirst({
    where: { organizationId: orgId, code },
  })
}

export async function getCategories(orgId: string) {
  return await prisma.category.findMany({
    where: { organizationId: orgId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })
}

export async function createCategory(orgId: string, data: any) {
  const code = data.code || undefined
  return await prisma.category.create({
    data: {
      ...data,
      code,
      organizationId: orgId,
    },
  })
}

export async function updateCategory(orgId: string, idOrCode: string, data: any) {
  return await prisma.category.updateMany({
    where: { 
      organizationId: orgId, 
      OR: [{ id: idOrCode }, { code: idOrCode }] 
    },
    data,
  })
}

export async function deleteCategory(orgId: string, idOrCode: string) {
  return await prisma.category.deleteMany({
    where: { 
      organizationId: orgId, 
      OR: [{ id: idOrCode }, { code: idOrCode }] 
    },
  })
}

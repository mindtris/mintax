import { prisma } from "@/lib/core/db"

export interface CreateItemInput {
  name: string
  categoryId?: string
  taxId?: string
  salePrice?: number
  purchasePrice?: number
  type?: "product" | "service"
  sku?: string
  description?: string
  enabled?: boolean
}

export interface UpdateItemInput {
  name?: string
  categoryId?: string
  taxId?: string
  salePrice?: number
  purchasePrice?: number
  type?: "product" | "service"
  sku?: string
  description?: string
  enabled?: boolean
}

export async function getItems(orgId: string) {
  return await prisma.item.findMany({
    where: {
      organizationId: orgId,
    },
    include: {
      category: true,
      tax: true,
    },
    orderBy: { name: "asc" },
  })
}

export async function createItem(orgId: string, data: CreateItemInput) {
  return await prisma.item.create({
    data: {
      organizationId: orgId,
      name: data.name,
      categoryId: data.categoryId,
      taxId: data.taxId,
      salePrice: data.salePrice || 0,
      purchasePrice: data.purchasePrice || 0,
      type: data.type || "service",
      sku: data.sku,
      description: data.description,
      enabled: data.enabled ?? true,
    },
  })
}

export async function updateItem(id: string, orgId: string, data: UpdateItemInput) {
  return await prisma.item.update({
    where: {
      id,
      organizationId: orgId,
    },
    data: {
      name: data.name,
      categoryId: data.categoryId,
      taxId: data.taxId,
      salePrice: data.salePrice,
      purchasePrice: data.purchasePrice,
      type: data.type,
      sku: data.sku,
      description: data.description,
      enabled: data.enabled,
    },
  })
}

export async function deleteItem(id: string, orgId: string) {
  return await prisma.item.delete({
    where: {
      id,
      organizationId: orgId,
    },
  })
}

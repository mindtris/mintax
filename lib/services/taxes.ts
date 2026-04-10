import { prisma } from "@/lib/core/db"

export interface CreateTaxInput {
  name: string
  rate: number
  type?: string
}

export interface UpdateTaxInput {
  name?: string
  rate?: number
  type?: string
  enabled?: boolean
}

export async function getTaxes(orgId: string) {
  return await prisma.tax.findMany({
    where: {
      organizationId: orgId,
    },
    orderBy: { rate: "asc" },
  })
}

export async function createTax(orgId: string, data: CreateTaxInput) {
  return await prisma.tax.create({
    data: {
      organizationId: orgId,
      name: data.name,
      rate: data.rate,
      type: data.type || "normal",
    },
  })
}

export async function updateTax(id: string, orgId: string, data: UpdateTaxInput) {
  return await prisma.tax.update({
    where: {
      id,
      organizationId: orgId,
    },
    data: {
      name: data.name,
      rate: data.rate,
      type: data.type,
      enabled: data.enabled,
    },
  })
}

export async function deleteTax(id: string, orgId: string) {
  return await prisma.tax.delete({
    where: {
      id,
      organizationId: orgId,
    },
  })
}

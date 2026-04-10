import { prisma } from "@/lib/core/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"

export type FieldData = {
  [key: string]: unknown
}

export const getFields = cache(async (orgId: string) => {
  return await prisma.field.findMany({
    where: { organizationId: orgId },
    orderBy: {
      createdAt: "asc",
    },
  })
})

export const createField = async (orgId: string, field: FieldData) => {
  if (!field.code) {
    field.code = codeFromName(field.name as string)
  }
  return await prisma.field.create({
    data: {
      ...field,
      organization: {
        connect: {
          id: orgId,
        },
      },
    } as Prisma.FieldCreateInput,
  })
}

export const updateField = async (orgId: string, code: string, field: FieldData) => {
  return await prisma.field.update({
    where: { organizationId_code: { code, organizationId: orgId } },
    data: field,
  })
}

export const deleteField = async (orgId: string, code: string) => {
  return await prisma.field.delete({
    where: { organizationId_code: { code, organizationId: orgId } },
  })
}

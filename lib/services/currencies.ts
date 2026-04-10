import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"

export const getCurrencies = cache(async (orgId: string) => {
  return await prisma.currency.findMany({
    where: { organizationId: orgId },
    orderBy: {
      code: "asc",
    },
  })
})

export const createCurrency = async (orgId: string, currency: Prisma.CurrencyCreateInput) => {
  return await prisma.currency.create({
    data: {
      ...currency,
      organization: {
        connect: {
          id: orgId,
        },
      },
    },
  })
}

export const updateCurrency = async (orgId: string, code: string, currency: Prisma.CurrencyUpdateInput) => {
  return await prisma.currency.update({
    where: { organizationId_code: { code, organizationId: orgId } },
    data: currency,
  })
}

export const deleteCurrency = async (orgId: string, code: string) => {
  return await prisma.currency.delete({
    where: { organizationId_code: { code, organizationId: orgId } },
  })
}

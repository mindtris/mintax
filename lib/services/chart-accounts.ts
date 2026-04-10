import { prisma } from "@/lib/core/db"
import { cache } from "react"

export type ChartAccountData = {
  code: string
  name: string
  type: string
  parentId?: string
  description?: string
}

export const getChartAccounts = cache(async (orgId: string) => {
  return await prisma.chartAccount.findMany({
    where: { organizationId: orgId },
    include: {
      children: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { code: "asc" },
  })
})

export const getChartAccountsByType = cache(async (orgId: string, type: string) => {
  return await prisma.chartAccount.findMany({
    where: { organizationId: orgId, type },
    orderBy: { code: "asc" },
  })
})

export const getChartAccountByCode = cache(async (orgId: string, code: string) => {
  return await prisma.chartAccount.findUnique({
    where: { organizationId_code: { organizationId: orgId, code } },
  })
})

export async function createChartAccount(orgId: string, data: ChartAccountData) {
  return await prisma.chartAccount.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  })
}

export async function updateChartAccount(id: string, orgId: string, data: Partial<ChartAccountData>) {
  return await prisma.chartAccount.update({
    where: { id, organizationId: orgId },
    data,
  })
}

export async function deleteChartAccount(id: string, orgId: string) {
  return await prisma.chartAccount.delete({
    where: { id, organizationId: orgId },
  })
}

// Financial summary for P&L and Balance Sheet
export const getAccountBalances = cache(async (orgId: string, dateFrom?: string, dateTo?: string) => {
  const where: any = { organizationId: orgId }
  if (dateFrom || dateTo) {
    where.issuedAt = {
      gte: dateFrom ? new Date(dateFrom) : undefined,
      lte: dateTo ? new Date(dateTo) : undefined,
    }
  }

  const transactions = await prisma.transaction.groupBy({
    by: ["chartAccountId"],
    where,
    _sum: { total: true },
    _count: true,
  })

  const accounts = await prisma.chartAccount.findMany({
    where: { organizationId: orgId },
    orderBy: { code: "asc" },
  })

  return accounts.map((account) => {
    const txGroup = transactions.find((t) => t.chartAccountId === account.id)
    return {
      ...account,
      balance: txGroup?._sum.total || 0,
      transactionCount: txGroup?._count || 0,
    }
  })
})

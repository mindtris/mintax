import { prisma } from "@/lib/core/db"
import { Field, Prisma, Transaction } from "@/lib/prisma/client"
import { cache } from "react"
import { getFields } from "./fields"
import { deleteFile } from "./files"

export type TransactionData = {
  name?: string | null
  description?: string | null
  merchant?: string | null
  total?: number | null
  currencyCode?: string | null
  convertedTotal?: number | null
  convertedCurrencyCode?: string | null
  type?: string | null
  items?: TransactionData[] | undefined
  note?: string | null
  files?: string[] | undefined
  extra?: Record<string, unknown>
  categoryCode?: string | null
  projectCode?: string | null
  chartAccountId?: string | null
  bankAccountId?: string | null
  paymentMethod?: string | null
  taxAmount?: number | null
  taxRate?: string | null
  issuedAt?: Date | string | null
  text?: string | null
  [key: string]: unknown
}

export type TransactionFilters = {
  search?: string
  dateFrom?: string
  dateTo?: string
  ordering?: string
  categoryCode?: string
  projectCode?: string
  type?: string
  reconciled?: boolean
  bankAccountId?: string
  page?: number
}

export type TransactionPagination = {
  limit: number
  offset: number
}

export const getTransactions = cache(
  async (
    orgId: string,
    filters?: TransactionFilters,
    pagination?: TransactionPagination
  ): Promise<{
    transactions: Transaction[]
    total: number
  }> => {
    const { where, orderBy } = buildTransactionsWhere(orgId, filters)

    if (pagination) {
      const total = await prisma.transaction.count({ where })
      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          category: true,
          project: true,
          bankAccount: true,
          chartAccount: true,
        },
        orderBy,
        take: pagination?.limit,
        skip: pagination?.offset,
      })
      return { transactions, total }
    } else {
      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          category: true,
          project: true,
          bankAccount: true,
          chartAccount: true,
        },
        orderBy,
      })
      return { transactions, total: transactions.length }
    }
  }
)

/**
 * Shared logic to build the where clause for transactions.
 */
export function buildTransactionsWhere(orgId: string, filters?: TransactionFilters) {
  const where: Prisma.TransactionWhereInput = { organizationId: orgId }
  let orderBy: Prisma.TransactionOrderByWithRelationInput = { issuedAt: "desc" }

  if (filters) {
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { merchant: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { note: { contains: filters.search, mode: "insensitive" } },
        { text: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    if (filters.categoryCode) {
      where.categoryCode = filters.categoryCode
    }

    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.reconciled !== undefined) {
      where.reconciled = filters.reconciled
    }

    if (filters.bankAccountId) {
      where.bankAccountId = filters.bankAccountId
    }

    if (filters.ordering) {
      const isDesc = filters.ordering.startsWith("-")
      const field = isDesc ? filters.ordering.slice(1) : filters.ordering
      orderBy = { [field]: isDesc ? "desc" : "asc" }
    }
  }

  return { where, orderBy }
}

export const getTransactionById = cache(async (id: string, orgId: string): Promise<Transaction | null> => {
  return await prisma.transaction.findUnique({
    where: { id, organizationId: orgId },
    include: {
      category: true,
      project: true,
      bankAccount: true,
      chartAccount: true,
    },
  })
})

export const getTransactionsByFileId = cache(async (fileId: string, orgId: string): Promise<Transaction[]> => {
  return await prisma.transaction.findMany({
    where: { files: { array_contains: [fileId] }, organizationId: orgId },
  })
})

export const createTransaction = async (orgId: string, userId: string, data: TransactionData): Promise<Transaction> => {
  const { standard, extra } = await splitTransactionDataExtraFields(data, orgId)

  return await prisma.transaction.create({
    data: {
      ...standard,
      extra: extra,
      items: data.items as Prisma.InputJsonValue,
      organizationId: orgId,
      userId,
    },
  })
}

export const updateTransaction = async (id: string, orgId: string, data: TransactionData): Promise<Transaction> => {
  const { standard, extra } = await splitTransactionDataExtraFields(data, orgId)

  return await prisma.transaction.update({
    where: { id, organizationId: orgId },
    data: {
      ...standard,
      extra: extra,
      items: data.items ? (data.items as Prisma.InputJsonValue) : [],
    },
  })
}

export const updateTransactionFiles = async (id: string, orgId: string, files: string[]): Promise<Transaction> => {
  return await prisma.transaction.update({
    where: { id, organizationId: orgId },
    data: { files },
  })
}

export const deleteTransaction = async (id: string, orgId: string): Promise<Transaction | undefined> => {
  const transaction = await getTransactionById(id, orgId)

  if (transaction) {
    const files = Array.isArray(transaction.files) ? transaction.files : []

    for (const fileId of files as string[]) {
      if ((await getTransactionsByFileId(fileId, orgId)).length <= 1) {
        await deleteFile(fileId, orgId)
      }
    }

    return await prisma.transaction.delete({
      where: { id, organizationId: orgId },
    })
  }
}

export const bulkDeleteTransactions = async (ids: string[], orgId: string) => {
  return await prisma.transaction.deleteMany({
    where: { id: { in: ids }, organizationId: orgId },
  })
}

const splitTransactionDataExtraFields = async (
  data: TransactionData,
  orgId: string
): Promise<{ standard: TransactionData; extra: Prisma.InputJsonValue }> => {
  const fields = await getFields(orgId)
  const fieldMap = fields.reduce(
    (acc, field) => {
      acc[field.code] = field
      return acc
    },
    {} as Record<string, Field>
  )

  const standard: TransactionData = {}
  const extra: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    const fieldDef = fieldMap[key]
    if (fieldDef) {
      if (fieldDef.isExtra) {
        extra[key] = value
      } else {
        standard[key] = value
      }
    }
  })

  return { standard, extra: extra as Prisma.InputJsonValue }
}

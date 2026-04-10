import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"

export type BankAccountData = {
  name: string
  accountNumber?: string
  bankName?: string
  ifscCode?: string
  accountType?: string
  currency?: string
}

export type BankAccountFilters = {
  search?: string
  accountType?: string
}

export const getBankAccounts = cache(async (orgId: string, filters?: BankAccountFilters) => {
  const where: Prisma.BankAccountWhereInput = { 
    organizationId: orgId, 
    isActive: true 
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { bankName: { contains: filters.search, mode: "insensitive" } },
      { accountNumber: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters?.accountType && filters.accountType !== "-") {
    where.accountType = filters.accountType
  }

  return await prisma.bankAccount.findMany({
    where,
    orderBy: { name: "asc" },
  })
})

export const getBankAccountById = cache(async (id: string, orgId: string) => {
  return await prisma.bankAccount.findFirst({
    where: { id, organizationId: orgId },
  })
})

export async function createBankAccount(orgId: string, data: BankAccountData) {
  return await prisma.bankAccount.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  })
}

export async function updateBankAccount(id: string, orgId: string, data: Prisma.BankAccountUpdateInput) {
  return await prisma.bankAccount.update({
    where: { id, organizationId: orgId },
    data,
  })
}

export async function deleteBankAccount(id: string, orgId: string) {
  return await prisma.bankAccount.update({
    where: { id, organizationId: orgId },
    data: { isActive: false },
  })
}

export async function updateBankAccountBalance(id: string, balance: number) {
  return await prisma.bankAccount.update({
    where: { id },
    data: { currentBalance: balance },
  })
}

// Bank Statements

export const getBankStatements = cache(async (bankAccountId: string) => {
  return await prisma.bankStatement.findMany({
    where: { bankAccountId },
    include: {
      _count: { select: { entries: true } },
    },
    orderBy: { periodEnd: "desc" },
  })
})

export async function createBankStatement(
  bankAccountId: string,
  periodStart: Date,
  periodEnd: Date,
  fileId?: string
) {
  return await prisma.bankStatement.create({
    data: {
      bankAccountId,
      periodStart,
      periodEnd,
      fileId,
    },
  })
}

// Bank Entries

export const getBankEntries = cache(async (statementId: string) => {
  return await prisma.bankEntry.findMany({
    where: { statementId },
    orderBy: { date: "asc" },
  })
})

export const getUnmatchedEntries = cache(async (bankAccountId: string) => {
  const statements = await prisma.bankStatement.findMany({
    where: { bankAccountId },
    select: { id: true },
  })
  const statementIds = statements.map((s) => s.id)

  return await prisma.bankEntry.findMany({
    where: {
      statementId: { in: statementIds },
      status: "unmatched",
    },
    orderBy: { date: "desc" },
  })
})

export async function createBankEntry(
  statementId: string,
  data: {
    date: Date
    description: string
    amount: number
    balance?: number
    reference?: string
  }
) {
  return await prisma.bankEntry.create({
    data: {
      ...data,
      statementId,
    },
  })
}

export async function matchBankEntry(entryId: string, transactionId: string) {
  return await prisma.bankEntry.update({
    where: { id: entryId },
    data: {
      transactionId,
      status: "matched",
    },
  })
}

export async function reconcileBankEntry(entryId: string) {
  return await prisma.bankEntry.update({
    where: { id: entryId },
    data: { status: "reconciled" },
  })
}

export async function excludeBankEntry(entryId: string) {
  return await prisma.bankEntry.update({
    where: { id: entryId },
    data: { status: "excluded" },
  })
}

export async function unmatchBankEntry(entryId: string) {
  return await prisma.bankEntry.update({
    where: { id: entryId },
    data: {
      transactionId: null,
      status: "unmatched",
    },
  })
}

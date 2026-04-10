"use server"

import { prisma } from "@/lib/core/db"
import { safePathJoin } from "@/lib/files"
import { getStorage } from "@/lib/storage"
import { cache } from "react"
import { getTransactionById } from "./transactions"

export type UnsortedFileFilters = {
  search?: string
}

export const getUnsortedFiles = cache(async (orgId: string, filters?: UnsortedFileFilters) => {
  const where: any = {
    isReviewed: false,
    organizationId: orgId,
  }

  if (filters?.search) {
    where.filename = { contains: filters.search, mode: "insensitive" }
  }

  return await prisma.file.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  })
})

export const getUnsortedFilesCount = cache(async (orgId: string) => {
  return await prisma.file.count({
    where: {
      isReviewed: false,
      organizationId: orgId,
    },
  })
})

export const getFileById = cache(async (id: string, orgId: string) => {
  return await prisma.file.findFirst({
    where: { id, organizationId: orgId },
  })
})

export const getFilesByTransactionId = cache(async (id: string, orgId: string) => {
  const transaction = await getTransactionById(id, orgId)
  if (transaction && transaction.files) {
    return await prisma.file.findMany({
      where: {
        id: {
          in: transaction.files as string[],
        },
        organizationId: orgId,
      },
      orderBy: {
        createdAt: "asc",
      },
    })
  }
  return []
})

export const createFile = async (orgId: string, userId: string, data: any) => {
  return await prisma.file.create({
    data: {
      ...data,
      organizationId: orgId,
      userId,
    },
  })
}

export const updateFile = async (id: string, orgId: string, data: any) => {
  return await prisma.file.update({
    where: { id, organizationId: orgId },
    data,
  })
}

export const deleteFile = async (id: string, orgId: string) => {
  const file = await getFileById(id, orgId)
  if (!file) {
    return
  }

  // Look up user email to build the full storage path
  const user = await prisma.user.findFirst({ where: { id: file.userId }, select: { email: true } })
  if (user) {
    try {
      const storagePath = safePathJoin(user.email, file.path)
      await getStorage().delete(storagePath)
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  return await prisma.file.delete({
    where: { id, organizationId: orgId },
  })
}

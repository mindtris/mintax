"use server"

import { prisma } from "@/lib/core/db"
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

  // file.path is already the full org-scoped storage path
  try {
    await getStorage().delete(file.path)
  } catch (error) {
    console.error("Error deleting file:", error)
  }

  return await prisma.file.delete({
    where: { id, organizationId: orgId },
  })
}

// ── Join table helpers ────────────────────────────────────────────────────

export const getFilesByTransactionIdV2 = cache(async (transactionId: string, orgId: string) => {
  const rows = await prisma.transactionFile.findMany({
    where: { transaction: { id: transactionId, organizationId: orgId } },
    include: { file: true },
    orderBy: { createdAt: "asc" },
  })
  return rows.map((r) => r.file)
})

export async function attachFileToTransaction(transactionId: string, fileId: string) {
  return prisma.transactionFile.upsert({
    where: { transactionId_fileId: { transactionId, fileId } },
    create: { transactionId, fileId },
    update: {},
  })
}

export async function detachFileFromTransaction(transactionId: string, fileId: string) {
  return prisma.transactionFile.deleteMany({ where: { transactionId, fileId } })
}

export async function getFilesByInvoiceId(invoiceId: string, orgId: string) {
  const rows = await prisma.invoiceFile.findMany({
    where: { invoice: { id: invoiceId, organizationId: orgId } },
    include: { file: true },
    orderBy: { createdAt: "asc" },
  })
  return rows.map((r) => r.file)
}

export async function attachFileToInvoice(invoiceId: string, fileId: string) {
  return prisma.invoiceFile.upsert({
    where: { invoiceId_fileId: { invoiceId, fileId } },
    create: { invoiceId, fileId },
    update: {},
  })
}

export async function getFilesByBillId(billId: string, orgId: string) {
  const rows = await prisma.billFile.findMany({
    where: { bill: { id: billId, organizationId: orgId } },
    include: { file: true },
    orderBy: { createdAt: "asc" },
  })
  return rows.map((r) => r.file)
}

export async function attachFileToBill(billId: string, fileId: string) {
  return prisma.billFile.upsert({
    where: { billId_fileId: { billId, fileId } },
    create: { billId, fileId },
    update: {},
  })
}

export async function getFilesByCandidate(candidateId: string, orgId: string) {
  const rows = await prisma.candidateFile.findMany({
    where: { candidate: { id: candidateId, organizationId: orgId } },
    include: { file: true },
    orderBy: { createdAt: "asc" },
  })
  return rows.map((r) => ({ ...r.file, label: r.label }))
}

export async function attachFileToCandidate(candidateId: string, fileId: string, label?: string) {
  return prisma.candidateFile.upsert({
    where: { candidateId_fileId: { candidateId, fileId } },
    create: { candidateId, fileId, label },
    update: { label },
  })
}

export async function getFilesByLead(leadId: string, orgId: string) {
  const rows = await prisma.leadFile.findMany({
    where: { lead: { id: leadId, organizationId: orgId } },
    include: { file: true },
    orderBy: { createdAt: "asc" },
  })
  return rows.map((r) => ({ ...r.file, label: r.label }))
}

export async function attachFileToLead(leadId: string, fileId: string, label?: string) {
  return prisma.leadFile.upsert({
    where: { leadId_fileId: { leadId, fileId } },
    create: { leadId, fileId, label },
    update: { label },
  })
}

/** Generic helper to upload a file via storage abstraction and create a File DB record */
export async function uploadAndCreateFile(
  orgId: string,
  userId: string,
  file: globalThis.File,
  storagePath: string,
) {
  const { createHash, randomUUID } = await import("crypto")
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentHash = createHash("sha256").update(buffer).digest("hex")

  // Duplicate detection: if a File with the same hash already exists in this
  // org, return it instead of uploading again. Saves storage and avoids
  // creating duplicate transactions from re-uploaded receipts.
  const existing = await prisma.file.findFirst({
    where: { organizationId: orgId, contentHash },
  })
  if (existing) return existing

  await getStorage().put(storagePath, buffer)

  return createFile(orgId, userId, {
    id: randomUUID(),
    filename: file.name,
    path: storagePath,
    mimetype: file.type,
    size: file.size,
    contentHash,
    isReviewed: true,
    metadata: { size: file.size, lastModified: file.lastModified },
  })
}

/** Lookup a file by content hash (used for duplicate warnings) */
export async function findFileByHash(orgId: string, contentHash: string) {
  return prisma.file.findFirst({ where: { organizationId: orgId, contentHash } })
}

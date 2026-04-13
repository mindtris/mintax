"use server"

import { transactionFormSchema } from "@/lib/schemas/transactions"
import { ActionState } from "@/lib/actions"
import { getActiveOrg, getCurrentUser, isSubscriptionExpired } from "@/lib/core/auth"
import {
  getDirectorySize,
  getOrgRoot,
  getTransactionFilePath,
  isEnoughStorageToUploadFile,
} from "@/lib/files"
import { updateField } from "@/lib/services/fields"
import { createFile, deleteFile, attachFileToTransaction, uploadAndCreateFile } from "@/lib/services/files"
import {
  bulkDeleteTransactions,
  createTransaction,
  deleteTransaction,
  getNextTransactionNumber,
  getTransactionById,
  updateTransaction,
  updateTransactionFiles,
} from "@/lib/services/transactions"
import { updateUser } from "@/lib/services/users"
import { Transaction } from "@/lib/prisma/client"
import { prisma } from "@/lib/core/db"
import { getStorage } from "@/lib/storage"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

export async function createTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    // Pull files out before validation — they're handled separately.
    const receiptFiles = formData.getAll("receipts") as File[]
    formData.delete("receipts")

    // Validate the rest of the form
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    // Auto-generate the transaction number if the user didn't supply one
    const data = { ...validatedForm.data }
    if (!data.number || data.number.trim() === "") {
      data.number = await getNextTransactionNumber(org.id)
    }

    // Apply category defaults, categorization rules, and vendor memory
    const { resolveTransactionDefaults } = await import("@/lib/services/transaction-intelligence")
    const resolved = await resolveTransactionDefaults(org.id, {
      merchant: data.merchant,
      total: data.total,
      paymentMethod: data.paymentMethod,
      contactId: data.contactId,
      categoryCode: data.categoryCode,
      chartAccountId: data.chartAccountId,
      projectCode: data.projectCode,
      taxRate: data.taxRate,
    })
    Object.assign(data, {
      categoryCode: resolved.categoryCode,
      chartAccountId: resolved.chartAccountId,
      projectCode: resolved.projectCode,
      taxRate: resolved.taxRate,
    })

    const transaction = await createTransaction(org.id, user.id, data)

    // Attach receipt files via storage abstraction
    const validReceipts = receiptFiles.filter((f) => f && f.size > 0)
    if (validReceipts.length > 0) {
      const { getTransactionFilePath } = await import("@/lib/files")
      for (const file of validReceipts) {
        try {
          const { randomUUID } = await import("crypto")
          const storagePath = getTransactionFilePath(
            org.id,
            randomUUID(),
            file.name,
            transaction.issuedAt || undefined,
          )
          const fileRecord = await uploadAndCreateFile(org.id, user.id, file, storagePath)
          await attachFileToTransaction(transaction.id, fileRecord.id)
        } catch (uploadErr) {
          console.error("Receipt upload failed:", uploadErr)
        }
      }
    }

    revalidatePath("/accounts")
    revalidatePath(`/transactions/${transaction.id}`)
    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to create transaction:", error)
    return { success: false, error: "Failed to create transaction" }
  }
}

export async function saveTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const transactionId = formData.get("transactionId") as string
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    const transaction = await updateTransaction(transactionId, org.id, validatedForm.data)

    revalidatePath("/accounts")
    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to update transaction:", error)
    return { success: false, error: "Failed to save transaction" }
  }
}

export async function deleteTransactionAction(
  _prevState: ActionState<Transaction> | null,
  transactionId: string
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const transaction = await getTransactionById(transactionId, org.id)
    if (!transaction) throw new Error("Transaction not found")

    await deleteTransaction(transaction.id, org.id)

    revalidatePath("/accounts")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to delete transaction:", error)
    return { success: false, error: "Failed to delete transaction" }
  }
}

export async function approveTransactionsAction(
  transactionIds: string[],
): Promise<ActionState<{ count: number }>> {
  if (!transactionIds || transactionIds.length === 0) {
    return { success: false, error: "No transactions selected" }
  }
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        organizationId: org.id,
      },
      data: { status: "posted" },
    })

    revalidatePath("/accounts")
    revalidatePath("/transactions/needs-review")
    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("Failed to approve transactions:", error)
    return { success: false, error: "Failed to approve transactions" }
  }
}

export async function deleteTransactionFileAction(
  transactionId: string,
  fileId: string
): Promise<ActionState<Transaction>> {
  if (!fileId || !transactionId) {
    return { success: false, error: "File ID and transaction ID are required" }
  }

  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const transaction = await getTransactionById(transactionId, org.id)
  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  await updateTransactionFiles(
    transactionId,
    org.id,
    transaction.files ? (transaction.files as string[]).filter((id) => id !== fileId) : []
  )

  await deleteFile(fileId, org.id)

  // Update user storage used (computed from org root)
  const storageUsed = await getDirectorySize(getOrgRoot(org.id))
  await updateUser(user.id, { storageUsed })

  revalidatePath("/accounts")
  revalidatePath(`/transactions/${transactionId}`)
  return { success: true, data: transaction }
}

export async function uploadTransactionFilesAction(formData: FormData): Promise<ActionState<Transaction>> {
  try {
    const transactionId = formData.get("transactionId") as string
    const files = formData.getAll("files") as File[]

    if (!files || !transactionId) {
      return { success: false, error: "No files or transaction ID provided" }
    }

    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const transaction = await getTransactionById(transactionId, org.id)
    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    const storage = getStorage()

    // Check limits
    const totalFileSize = files.reduce((acc, file) => acc + file.size, 0)
    if (!isEnoughStorageToUploadFile(user, totalFileSize)) {
      return { success: false, error: `Insufficient storage to upload new files` }
    }

    if (isSubscriptionExpired(user)) {
      return {
        success: false,
        error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
      }
    }

    const fileRecords = await Promise.all(
      files.map(async (file) => {
        const fileUuid = randomUUID()
        const storagePath = getTransactionFilePath(org.id, fileUuid, file.name, transaction.issuedAt || undefined)
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        await storage.put(storagePath, buffer)

        // Create file record in database
        const fileRecord = await createFile(org.id, user.id, {
          id: fileUuid,
          filename: file.name,
          path: storagePath,
          mimetype: file.type,
          size: file.size,
          isReviewed: true,
          metadata: {
            size: file.size,
            lastModified: file.lastModified,
          },
        })

        return fileRecord
      })
    )

    // Create join table entries
    for (const fileRecord of fileRecords) {
      await attachFileToTransaction(transactionId, fileRecord.id)
    }

    // Also update legacy JSON column for backwards compat
    await updateTransactionFiles(
      transactionId,
      org.id,
      transaction.files
        ? [...(transaction.files as string[]), ...fileRecords.map((file) => file.id)]
        : fileRecords.map((file) => file.id)
    )

    // Update user storage used (computed from org root)
    const storageUsed = await getDirectorySize(getOrgRoot(org.id))
    await updateUser(user.id, { storageUsed })

    revalidatePath("/accounts")
    revalidatePath(`/transactions/${transactionId}`)
    return { success: true }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: `File upload failed: ${error}` }
  }
}

export async function bulkDeleteTransactionsAction(transactionIds: string[]) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    await bulkDeleteTransactions(transactionIds, org.id)
    revalidatePath("/accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete transactions:", error)
    return { success: false, error: "Failed to delete transactions" }
  }
}

export async function updateFieldVisibilityAction(fieldCode: string, isVisible: boolean) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    await updateField(org.id, fieldCode, {
      isVisibleInList: isVisible,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to update field visibility:", error)
    return { success: false, error: "Failed to update field visibility" }
  }
}

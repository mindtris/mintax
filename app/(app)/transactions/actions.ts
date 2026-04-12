"use server"

import { transactionFormSchema } from "@/lib/schemas/transactions"
import { ActionState } from "@/lib/actions"
import { getActiveOrg, getCurrentUser, isSubscriptionExpired } from "@/lib/core/auth"
import {
  getDirectorySize,
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  isEnoughStorageToUploadFile,
  safePathJoin,
} from "@/lib/files"
import { updateField } from "@/lib/services/fields"
import { createFile, deleteFile, attachFileToTransaction } from "@/lib/services/files"
import {
  bulkDeleteTransactions,
  createTransaction,
  deleteTransaction,
  getTransactionById,
  updateTransaction,
  updateTransactionFiles,
} from "@/lib/services/transactions"
import { updateUser } from "@/lib/services/users"
import { Transaction } from "@/lib/prisma/client"
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
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    const transaction = await createTransaction(org.id, user.id, validatedForm.data)

    revalidatePath("/accounts")
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

  // Update user storage used
  const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
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
    const userUploadsDirectory = getUserUploadsDirectory(user)

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
        const relativeFilePath = getTransactionFileUploadPath(fileUuid, file.name, transaction)
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const fullStoragePath = safePathJoin(userUploadsDirectory, relativeFilePath)
        await storage.put(fullStoragePath, buffer)

        // Create file record in database
        const fileRecord = await createFile(org.id, user.id, {
          id: fileUuid,
          filename: file.name,
          path: relativeFilePath,
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

    // Update user storage used
    const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
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

"use server"

import { AnalysisResult, analyzeTransaction } from "@/lib/ai/analyze"
import { AnalyzeAttachment, loadAttachmentsForAI } from "@/lib/ai/attachments"
import { buildLLMPrompt } from "@/lib/ai/prompt"
import { fieldsToJsonSchema } from "@/lib/ai/schema"
import { transactionFormSchema } from "@/lib/schemas/transactions"
import { ActionState } from "@/lib/actions"
import { getActiveOrg, getCurrentUser, isAiBalanceExhausted, isSubscriptionExpired } from "@/lib/core/auth"
import {
  getDirectorySize,
  getOrgRoot,
  getTransactionFilePath,
  getUnsortedFilePath,
} from "@/lib/files"
import { autoAssignCOA, isHighConfidenceResult } from "@/lib/services/automation"
import { DEFAULT_PROMPT_ANALYSE_NEW_FILE } from "@/lib/services/defaults"
import { createFile, deleteFile, getFileById, updateFile } from "@/lib/services/files"
import { createTransaction, TransactionData, updateTransactionFiles } from "@/lib/services/transactions"
import { updateUser } from "@/lib/services/users"
import { getStorage } from "@/lib/storage"
import { Category, Field, File, Project, Transaction } from "@/lib/prisma/client"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import path from "path"

export async function analyzeFileAction(
  file: File,
  settings: Record<string, string>,
  fields: Field[],
  categories: Category[],
  projects: Project[]
): Promise<ActionState<AnalysisResult>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  if (!file || file.userId !== user.id) {
    return { success: false, error: "File not found or does not belong to the user" }
  }

  if (isAiBalanceExhausted(user)) {
    return {
      success: false,
      error: "You used all of your pre-paid AI scans, please upgrade your account or buy new subscription plan",
    }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
    }
  }

  let attachments: AnalyzeAttachment[] = []
  try {
    attachments = await loadAttachmentsForAI(org.id, file)
  } catch (error) {
    console.error("Failed to retrieve files:", error)
    return { success: false, error: "Failed to retrieve files: " + error }
  }

  // Try DB prompt first, fall back to settings, then default
  const { getLlmPromptsByModule } = await import("@/lib/services/llm-prompts")
  const dbPrompts = await getLlmPromptsByModule(org.id, "unsorted")
  const dbPrompt = dbPrompts[0] // Use first enabled prompt for unsorted
  const promptTemplate = dbPrompt?.prompt || settings.prompt_analyse_new_file || DEFAULT_PROMPT_ANALYSE_NEW_FILE

  const prompt = buildLLMPrompt(
    promptTemplate,
    fields,
    categories,
    projects
  )

  const schema = fieldsToJsonSchema(fields)

  const results = await analyzeTransaction(prompt, schema, attachments, file.id, org.id)

  console.log("Analysis results:", results)

  if (results.data?.tokensUsed && results.data.tokensUsed > 0) {
    await updateUser(user.id, { aiBalance: { decrement: 1 } })
  }

  // Auto-accept if high confidence
  if (results.success && results.data?.output && isHighConfidenceResult(results.data.output)) {
    console.log("[AUTO-ACCEPT] High confidence result for file:", file.id)
    const autoResult = await acceptAISuggestionsAction(file.id)
    if (autoResult.success) {
      return {
        ...results,
        data: { ...results.data!, autoAccepted: true } as any,
      }
    }
  }

  return results
}

export async function saveFileAsTransactionAction(
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

    // Get the file record
    const fileId = formData.get("fileId") as string
    const file = await getFileById(fileId, org.id)
    if (!file) throw new Error("File not found")

    // Create transaction
    const transaction = await createTransaction(org.id, user.id, validatedForm.data)

    // Move file to processed location
    const storage = getStorage()
    const originalFileName = path.basename(file.path)
    const newStoragePath = getTransactionFilePath(org.id, file.id, originalFileName, transaction.issuedAt || undefined)

    await storage.move(file.path, newStoragePath)

    // Update file record
    await updateFile(file.id, org.id, {
      path: newStoragePath,
      isReviewed: true,
    })

    await updateTransactionFiles(transaction.id, org.id, [file.id])

    revalidatePath("/accounts")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to save transaction:", error)
    return { success: false, error: `Failed to save transaction: ${error}` }
  }
}

export async function deleteUnsortedFileAction(
  _prevState: ActionState<Transaction> | null,
  fileId: string
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    await deleteFile(fileId, org.id)
    revalidatePath("/accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete file:", error)
    return { success: false, error: "Failed to delete file" }
  }
}

export async function splitFileIntoItemsAction(
  _prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const fileId = formData.get("fileId") as string
    const items = JSON.parse(formData.get("items") as string) as TransactionData[]

    if (!fileId || !items || items.length === 0) {
      return { success: false, error: "File ID and items are required" }
    }

    // Get the original file
    const originalFile = await getFileById(fileId, org.id)
    if (!originalFile) {
      return { success: false, error: "Original file not found" }
    }

    // Get the original file's content from storage
    const storage = getStorage()
    const fileContent = await storage.get(originalFile.path)

    // Create a new file for each item
    for (const item of items) {
      const fileUuid = randomUUID()
      const fileName = `${originalFile.filename}-part-${item.name}`
      const storagePath = getUnsortedFilePath(org.id, fileUuid, fileName)

      // Copy the original file content
      await storage.put(storagePath, fileContent)

      // Create file record in database with the item data cached
      await createFile(org.id, user.id, {
        id: fileUuid,
        filename: fileName,
        path: storagePath,
        mimetype: originalFile.mimetype,
        metadata: originalFile.metadata,
        isSplitted: true,
        cachedParseResult: {
          name: item.name,
          merchant: item.merchant,
          description: item.description,
          total: item.total,
          currencyCode: item.currencyCode,
          categoryCode: item.categoryCode,
          projectCode: item.projectCode,
          type: item.type,
          issuedAt: item.issuedAt,
          note: item.note,
          text: item.text,
        },
      })
    }

    // Delete the original file
    await deleteFile(fileId, org.id)

    // Update user storage used (computed from org root)
    const storageUsed = await getDirectorySize(getOrgRoot(org.id))
    await updateUser(user.id, { storageUsed })

    revalidatePath("/accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to split file into items:", error)
    return { success: false, error: `Failed to split file into items: ${error}` }
  }
}

export async function acceptAISuggestionsAction(fileId: string): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const file = await getFileById(fileId, org.id)

    if (!file) return { success: false, error: "File not found" }
    if (!file.cachedParseResult) return { success: false, error: "No AI analysis results found. Analyze the file first." }

    const parsed = file.cachedParseResult as Record<string, any>

    // Build transaction data from cached AI results
    const type = parsed.type || "expense"
    const categoryCode = parsed.categoryCode || undefined
    const chartAccountId = await autoAssignCOA(org.id, categoryCode, type)

    const transactionData: any = {
      name: parsed.name || file.filename,
      description: parsed.description || undefined,
      merchant: parsed.merchant || undefined,
      total: parsed.total ? Math.round(parseFloat(parsed.total) * 100) : undefined,
      currencyCode: parsed.currencyCode || undefined,
      categoryCode,
      projectCode: parsed.projectCode || undefined,
      type,
      issuedAt: parsed.issuedAt ? new Date(parsed.issuedAt) : new Date(),
      note: parsed.note || undefined,
      text: parsed.text || undefined,
      chartAccountId,
    }

    // Create the transaction
    const transaction = await createTransaction(org.id, user.id, transactionData)

    // Move file to transaction location
    const storage = getStorage()
    const originalFileName = path.basename(file.path)
    const newStoragePath = getTransactionFilePath(org.id, file.id, originalFileName, transaction.issuedAt || undefined)

    await storage.move(file.path, newStoragePath)

    await updateFile(file.id, org.id, {
      path: newStoragePath,
      isReviewed: true,
    })

    await updateTransactionFiles(transaction.id, org.id, [file.id])

    revalidatePath("/accounts")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to accept AI suggestions:", error)
    return { success: false, error: `Failed to create transaction: ${error}` }
  }
}

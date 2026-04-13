"use server"

import { ActionState } from "@/lib/actions"
import {
  getActiveOrg,
  getCurrentUser,
  isAiBalanceExhausted,
  isSubscriptionExpired,
} from "@/lib/core/auth"
import {
  getDirectorySize,
  getOrgRoot,
  getUnsortedFilePath,
  isEnoughStorageToUploadFile,
} from "@/lib/files"
import { createFile } from "@/lib/services/files"
import { updateUser } from "@/lib/services/users"
import { getStorage } from "@/lib/storage"
import { getCategories } from "@/lib/services/categories"
import { getFields } from "@/lib/services/fields"
import { getProjects } from "@/lib/services/projects"
import { getSettings } from "@/lib/services/settings"
import { analyzeFileAction } from "@/app/(app)/unsorted/actions"
import {
  findContactByMerchant,
  resolveTransactionDefaults,
} from "@/lib/services/transaction-intelligence"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

export type ExtractedReceiptFields = {
  issuedAt?: string
  total?: number
  currencyCode?: string
  merchant?: string
  description?: string
  name?: string
  categoryCode?: string
  projectCode?: string
  paymentMethod?: string
  taxRate?: string
  taxAmount?: number
  reference?: string
  note?: string
  contactId?: string
}

export type AnalyzePendingReceiptResult = {
  fileId: string
  filename: string
  mimetype: string
  analyzed: boolean
  extracted?: ExtractedReceiptFields
  analysisError?: string
}

/**
 * Upload + analyze a receipt BEFORE a transaction exists. The file is
 * persisted to `unsorted/` so it gracefully lives in the Unsorted tab if
 * the user cancels the transaction sheet. On save, createTransactionAction
 * will move it to the transaction's proper path via attachFileIds.
 */
export async function analyzePendingReceiptAction(
  _prevState: ActionState<AnalyzePendingReceiptResult> | null,
  formData: FormData,
): Promise<ActionState<AnalyzePendingReceiptResult>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const file = formData.get("file") as File | null

  if (!file || !(file instanceof File)) {
    return { success: false, error: "No file provided" }
  }

  if (!isEnoughStorageToUploadFile(user, file.size)) {
    return { success: false, error: "Insufficient storage to upload this file" }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired. Please upgrade to continue.",
    }
  }

  // ── 1. Persist to unsorted/ ──────────────────────────────────────────
  const storage = getStorage()
  const fileUuid = randomUUID()
  const storagePath = getUnsortedFilePath(org.id, fileUuid, file.name)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await storage.put(storagePath, buffer)

  const fileRecord = await createFile(org.id, user.id, {
    id: fileUuid,
    filename: file.name,
    path: storagePath,
    mimetype: file.type,
    size: file.size,
    metadata: { size: file.size, lastModified: file.lastModified },
  })

  // Update user's tracked storage usage
  const storageUsed = await getDirectorySize(getOrgRoot(org.id))
  await updateUser(user.id, { storageUsed })

  // Invalidate the unsorted list in case the user cancels and ends up there
  revalidatePath("/unsorted")

  // ── 2. Skip analysis for non-parseable files or exhausted AI ─────────
  const canAnalyze =
    !isAiBalanceExhausted(user) &&
    (file.type.startsWith("image/") || file.type === "application/pdf")

  if (!canAnalyze) {
    return {
      success: true,
      data: {
        fileId: fileRecord.id,
        filename: fileRecord.filename,
        mimetype: fileRecord.mimetype,
        analyzed: false,
      },
    }
  }

  // ── 3. Run AI analysis via existing unsorted pipeline ────────────────
  try {
    const [settings, fields, categoriesAll, projects] = await Promise.all([
      getSettings(org.id),
      getFields(org.id),
      getCategories(org.id),
      getProjects(org.id),
    ])
    const categories = categoriesAll.filter(
      (c) => c.type === "expense" || c.type === "income",
    )

    const result = await analyzeFileAction(
      fileRecord as any,
      settings,
      fields,
      categories,
      projects,
    )

    if (!result.success || !result.data?.output) {
      return {
        success: true,
        data: {
          fileId: fileRecord.id,
          filename: fileRecord.filename,
          mimetype: fileRecord.mimetype,
          analyzed: false,
          analysisError: result.error || "AI extraction returned no data",
        },
      }
    }

    const output = result.data.output as Record<string, any>

    // ── 4. Fuzzy-match merchant → existing Contact ─────────────────────
    let contactId: string | undefined
    if (output.merchant) {
      const match = await findContactByMerchant(org.id, output.merchant, "vendor")
      if (match) contactId = match.contact.id
    }

    // ── 5. Apply categorization rules + vendor memory + category defaults
    const total =
      output.total != null && output.total !== ""
        ? Math.round(parseFloat(String(output.total)) * 100)
        : undefined
    const resolved = await resolveTransactionDefaults(org.id, {
      merchant: output.merchant,
      total,
      contactId,
      categoryCode: output.categoryCode,
      chartAccountId: undefined,
      projectCode: output.projectCode,
      taxRate: output.taxRate,
    })

    return {
      success: true,
      data: {
        fileId: fileRecord.id,
        filename: fileRecord.filename,
        mimetype: fileRecord.mimetype,
        analyzed: true,
        extracted: {
          issuedAt: output.issuedAt,
          total: total,
          currencyCode: output.currencyCode,
          merchant: output.merchant,
          description: output.description,
          name: output.name,
          categoryCode: resolved.categoryCode || undefined,
          projectCode: resolved.projectCode || undefined,
          taxRate: resolved.taxRate || undefined,
          taxAmount: output.taxAmount
            ? Math.round(parseFloat(String(output.taxAmount)) * 100)
            : undefined,
          note: output.note,
          contactId: resolved.contactId || undefined,
        },
      },
    }
  } catch (error: any) {
    console.error("analyzePendingReceiptAction error:", error)
    return {
      success: true,
      data: {
        fileId: fileRecord.id,
        filename: fileRecord.filename,
        mimetype: fileRecord.mimetype,
        analyzed: false,
        analysisError: error?.message || "AI analysis failed",
      },
    }
  }
}

"use server"

import { getActiveOrg, getCurrentUser, isSubscriptionExpired } from "@/lib/core/auth"
import {
  getTransactionFilePath,
  isEnoughStorageToUploadFile,
} from "@/lib/files"
import { getAppData, setAppData } from "@/lib/services/apps"
import { createFile } from "@/lib/services/files"
import { createTransaction, updateTransactionFiles } from "@/lib/services/transactions"
import { Transaction } from "@/lib/prisma/client"
import { getStorage } from "@/lib/storage"
import { renderToBuffer } from "@react-pdf/renderer"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { createElement } from "react"
import { InvoiceFormData } from "./components/invoice-page"
import { InvoicePDF } from "./components/invoice-pdf"
import { InvoiceTemplate } from "./default-templates"
import { InvoiceAppData } from "./page"

export async function generateInvoicePDF(data: InvoiceFormData): Promise<Uint8Array> {
  const pdfElement = createElement(InvoicePDF, { data })
  const buffer = await renderToBuffer(pdfElement as any)
  return new Uint8Array(buffer)
}

export async function addNewTemplateAction(orgId: string, template: InvoiceTemplate) {
  const appData = (await getAppData(orgId, "invoices")) as InvoiceAppData | null
  const updatedTemplates = [...(appData?.templates || []), template]
  const appDataResult = await setAppData(orgId, "invoices", { ...appData, templates: updatedTemplates })
  return { success: true, data: appDataResult }
}

export async function deleteTemplateAction(orgId: string, templateId: string) {
  const appData = (await getAppData(orgId, "invoices")) as InvoiceAppData | null
  if (!appData) return { success: false, error: "No app data found" }

  const updatedTemplates = appData.templates.filter((t) => t.id !== templateId)
  const appDataResult = await setAppData(orgId, "invoices", { ...appData, templates: updatedTemplates })
  return { success: true, data: appDataResult }
}

export async function saveInvoiceAsTransactionAction(
  formData: InvoiceFormData
): Promise<{ success: boolean; error?: string; data?: Transaction }> {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(formData)

    // Calculate total amount from items
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0)
    const taxes = formData.additionalTaxes.reduce((sum, tax) => sum + tax.amount, 0)
    const fees = formData.additionalFees.reduce((sum, fee) => sum + fee.amount, 0)
    const totalAmount = (formData.taxIncluded ? subtotal : subtotal + taxes) + fees

    // Create transaction
    const transaction = await createTransaction(org.id, user.id, {
      name: `Invoice #${formData.invoiceNumber || "unknown"}`,
      merchant: `${formData.billTo.split("\n")[0]}`,
      total: totalAmount * 100,
      currencyCode: formData.currency,
      issuedAt: new Date(formData.date),
      categoryCode: null,
      projectCode: null,
      type: "income",
    })

    // Check storage limits
    if (!isEnoughStorageToUploadFile(user, pdfBuffer.length)) {
      return {
        success: false,
        error: "Insufficient storage to save invoice PDF",
      }
    }

    if (isSubscriptionExpired(user)) {
      return {
        success: false,
        error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
      }
    }

    // Save PDF file via storage provider
    const storage = getStorage()
    const fileUuid = randomUUID()
    const fileName = `invoice-${formData.invoiceNumber}.pdf`
    const storagePath = getTransactionFilePath(org.id, fileUuid, fileName, transaction.issuedAt || undefined)

    await storage.put(storagePath, Buffer.from(pdfBuffer))

    // Create file record in database
    const fileRecord = await createFile(org.id, user.id, {
      id: fileUuid,
      filename: fileName,
      path: storagePath,
      mimetype: "application/pdf",
      isReviewed: true,
      metadata: {
        size: pdfBuffer.length,
        lastModified: Date.now(),
      },
    })

    // Update transaction with the file ID
    await updateTransactionFiles(transaction.id, org.id, [fileRecord.id])

    revalidatePath("/accounts")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to save invoice as transaction:", error)
    return {
      success: false,
      error: `Failed to save invoice as transaction: ${error}`,
    }
  }
}

"use server"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { sendInvoiceEmail, sendInvoicePaymentReceiptEmail, sendInvoicePaymentReceivedEmail } from "@/lib/integrations/email"
import { getSettings } from "@/lib/services/settings"
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceById,
  markInvoicePaid,
  getNextInvoiceNumber,
} from "@/lib/services/invoices"
import { format } from "date-fns"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getBillFilePath, getInvoiceFilePath } from "@/lib/files"
import { uploadAndCreateFile, attachFileToInvoice } from "@/lib/services/files"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { prisma } from "@/lib/core/db"
import { InvoicePDF } from "@/components/invoices/invoice-pdf"
import { invoiceToFormData } from "@/components/invoices/templates"

export async function createInvoiceAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const type = formData.get("type") as string
  const contactId = (formData.get("contactId") as string) || undefined
  const clientName = formData.get("clientName") as string
  const clientEmail = formData.get("clientEmail") as string
  const clientAddress = formData.get("clientAddress") as string
  const clientTaxId = formData.get("clientTaxId") as string
  const subtotal = Math.round(parseFloat(formData.get("subtotal") as string || "0") * 100)
  const taxTotal = Math.round(parseFloat(formData.get("taxTotal") as string || "0") * 100)
  const total = Math.round(parseFloat(formData.get("total") as string || "0") * 100)
  const currency = formData.get("currency") as string || org.baseCurrency
  const issuedAt = formData.get("issuedAt") as string
  const dueAt = formData.get("dueAt") as string
  const subject = formData.get("subject") as string
  const description = formData.get("description") as string
  const notes = formData.get("notes") as string
  const itemsJson = formData.get("itemsJson") as string
  const files = formData.getAll("files") as File[]

  if (!clientName || clientName.trim().length < 1) {
    return { error: "Client name is required" }
  }

  // Handle items
  let items = []
  try {
    if (itemsJson) {
      items = JSON.parse(itemsJson)
    }
  } catch (e) {
    console.error("Failed to parse itemsJson:", e)
  }

  const invoiceNumber = await getNextInvoiceNumber(org.id, type || "sales")
  const issuedDate = issuedAt ? new Date(issuedAt) : new Date()

  const invoice = await createInvoice(org.id, {
    invoiceNumber,
    type: type || "sales",
    ...(contactId ? { contactId } : {}),
    clientName: clientName.trim(),
    clientEmail: clientEmail || undefined,
    clientAddress: clientAddress || undefined,
    clientTaxId: clientTaxId || undefined,
    subtotal,
    taxTotal,
    total: total || subtotal + taxTotal,
    currency,
    issuedAt: issuedDate,
    dueAt: dueAt ? new Date(dueAt) : undefined,
    subject: subject || undefined,
    description: description || undefined,
    notes: notes || undefined,
    items,
  })

  // Handle files via storage abstraction — bills go under /bills, everything else under /invoices
  const filePathBuilder = type === "bill" ? getBillFilePath : getInvoiceFilePath
  for (const file of files) {
    if (file && file.size > 0) {
      try {
        const { randomUUID } = await import("crypto")
        const storagePath = filePathBuilder(org.id, randomUUID(), file.name, issuedDate)
        const fileRecord = await uploadAndCreateFile(org.id, user.id, file, storagePath)
        await attachFileToInvoice(invoice.id, fileRecord.id)
      } catch (err) {
        console.error("Failed to upload file:", err)
      }
    }
  }

  revalidatePath("/invoices")
  revalidatePath("/estimates")
  
  return { success: true, id: invoice.id, message: `${type === "estimate" ? "Estimate" : "Invoice"} created successfully` }
}

export async function updateInvoiceAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const invoiceId = formData.get("invoiceId") as string

  const type = formData.get("type") as string
  const status = formData.get("status") as string
  const contactId = (formData.get("contactId") as string) || undefined
  const clientName = formData.get("clientName") as string
  const clientEmail = formData.get("clientEmail") as string
  const clientAddress = formData.get("clientAddress") as string
  const clientTaxId = formData.get("clientTaxId") as string
  const subtotal = Math.round(parseFloat(formData.get("subtotal") as string || "0") * 100)
  const taxTotal = Math.round(parseFloat(formData.get("taxTotal") as string || "0") * 100)
  const total = Math.round(parseFloat(formData.get("total") as string || "0") * 100)
  const currency = formData.get("currency") as string || org.baseCurrency
  const issuedAt = formData.get("issuedAt") as string
  const dueAt = formData.get("dueAt") as string
  const subject = formData.get("subject") as string
  const description = formData.get("description") as string
  const notes = formData.get("notes") as string
  const intent = formData.get("intent") as string

  if (!clientName || clientName.trim().length < 1) {
    return { error: "Client name is required" }
  }

  await updateInvoice(invoiceId, org.id, {
    type: type || undefined,
    status: status || undefined,
    ...(contactId ? { contactId } : {}),
    clientName: clientName.trim(),
    clientEmail: clientEmail || undefined,
    clientAddress: clientAddress || undefined,
    clientTaxId: clientTaxId || undefined,
    subtotal,
    taxTotal,
    total: total || subtotal + taxTotal,
    currency,
    issuedAt: issuedAt ? new Date(issuedAt) : undefined,
    dueAt: dueAt ? new Date(dueAt) : undefined,
    subject: subject || undefined,
    description: description || undefined,
    notes: notes || undefined,
  })

  // Handle immediate send intent if requested from the UI
  if (intent === "send") {
    const sendResult = await sendInvoiceAction(invoiceId)
    if (sendResult.error) {
      return { error: `Saved, but failed to send: ${sendResult.error}` }
    }
  }

  revalidatePath("/invoices")
  revalidatePath("/estimates")
  revalidatePath(`/invoices/${invoiceId}`)
  
  if (intent === "send") {
    return { success: true, message: "Invoice saved and sent successfully" }
  }

  redirect(type === "estimate" ? "/estimates" : "/invoices")
}

export async function markInvoicePaidAction(invoiceId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const invoice = await getInvoiceById(invoiceId, org.id)

  if (!invoice) return { error: "Invoice not found" }

  // Auto-create transaction from paid invoice
  const { createTransactionFromInvoice } = await import("@/lib/services/automation")
  const transaction = await createTransactionFromInvoice(org.id, user.id, {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    total: invoice.total,
    currency: invoice.currency,
    type: invoice.type,
    issuedAt: invoice.issuedAt,
    notes: invoice.notes,
    contactId: invoice.contactId,
  })

  await markInvoicePaid(invoiceId, org.id, transaction.id)

  // Send payment emails
  try {
    const emailSettings = await getSettings(org.id)
    const paidDate = format(new Date(), "MMMM d, yyyy")
    const total = (invoice.total / 100).toFixed(2)

    // Payment receipt to customer
    if (invoice.clientEmail) {
      await sendInvoicePaymentReceiptEmail({
        email: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        total,
        currency: invoice.currency,
        paidDate,
        orgName: org.name,
        emailSettings,
      })
    }

    // Payment received notification to admin
    const { getOrgMembers } = await import("@/lib/services/organizations")
    const members = await getOrgMembers(org.id)
    const admins = members.filter((m) => m.role === "owner" || m.role === "admin")
    for (const admin of admins) {
      await sendInvoicePaymentReceivedEmail({
        email: admin.user.email,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        total,
        currency: invoice.currency,
        paidDate,
        orgName: org.name,
        emailSettings,
      })
    }
  } catch (emailError) {
    console.error("Failed to send payment emails:", emailError)
  }

  revalidatePath("/invoices")
  revalidatePath("/accounts")
}

export async function deleteInvoiceAction(invoiceId: string) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    await deleteInvoice(invoiceId, org.id)
    revalidatePath("/invoices")
    revalidatePath("/estimates")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete invoice:", error)
    return { error: error.message || "Failed to delete" }
  }
}

export async function bulkDeleteInvoicesAction(invoiceIds: string[]) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  for (const id of invoiceIds) {
    await deleteInvoice(id, org.id)
  }

  revalidatePath("/invoices")
  revalidatePath("/estimates")
  return { success: true }
}

export async function bulkMarkInvoicesPaidAction(invoiceIds: string[]) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  for (const id of invoiceIds) {
    await markInvoicePaid(id, org.id)
  }

  revalidatePath("/invoices")
  return { success: true }
}

export async function sendInvoiceAction(invoiceId: string, attachPdf: boolean = true) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const [invoice, emailSettings] = await Promise.all([
    getInvoiceById(invoiceId, org.id),
    getSettings(org.id),
  ])

  if (!invoice) return { error: "Invoice not found" }
  if (!invoice.clientEmail) return { error: "Client email is required to send" }

  try {
    let pdfAttachment = undefined

    if (attachPdf) {
      const formData = invoiceToFormData(invoice, org, emailSettings)
      const pdfElement = createElement(InvoicePDF as any, { data: formData })
      const buffer = await renderToBuffer(pdfElement as any)

      pdfAttachment = {
        filename: `${invoice.type === "estimate" ? "Estimate" : "Invoice"}-${invoice.invoiceNumber}.pdf`,
        content: new Uint8Array(buffer),
        contentType: "application/pdf",
      }

      // Also attach to invoice file records if not already there
      const filePathBuilder = invoice.type === "bill" ? getBillFilePath : getInvoiceFilePath
      const { randomUUID } = await import("crypto")
      const fileUuid = randomUUID()
      const storagePath = filePathBuilder(org.id, fileUuid, pdfAttachment.filename, invoice.issuedAt || new Date())

      // Manual construction of File object for the helper or use put directly
      const { getStorage } = await import("@/lib/storage")
      await getStorage().put(storagePath, Buffer.from(pdfAttachment.content))

      const fileRecord = await prisma.file.create({
        data: {
          id: fileUuid,
          filename: pdfAttachment.filename,
          path: storagePath,
          mimetype: "application/pdf",
          size: pdfAttachment.content.length,
          isReviewed: true,
          userId: user.id,
          organizationId: org.id,
          metadata: { size: pdfAttachment.content.length },
        },
      })

      await attachFileToInvoice(invoice.id, fileRecord.id)
    }

    if (invoice.type === "estimate") {
      const { sendEstimateEmail } = await import("@/lib/integrations/email")
      await sendEstimateEmail({
        orgId: org.id,
        email: invoice.clientEmail,
        estimateNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        total: (invoice.total / 100).toFixed(2),
        currency: invoice.currency,
        orgName: org.name,
        emailSettings,
      })
    } else {
      await sendInvoiceEmail({
        orgId: org.id,
        email: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        total: (invoice.total / 100).toFixed(2),
        currency: invoice.currency,
        dueDate: invoice.dueAt ? format(invoice.dueAt, "MMMM d, yyyy") : "Not specified",
        orgName: org.name,
        notes: invoice.notes,
        emailSettings,
        pdfAttachment,
      })
    }

    await updateInvoice(invoiceId, org.id, { status: "sent" })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Critical error in sendInvoiceAction:", error)
    return { error: error.message || "Failed to send invoice email" }
  }
}

export async function generateAndAttachInvoicePDFAction(invoiceId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const [invoice, settings] = await Promise.all([
    getInvoiceById(invoiceId, org.id),
    getSettings(org.id),
  ])

  if (!invoice) return { error: "Invoice not found" }

  try {
    // Clean up existing invoice PDFs to avoid duplicates
    const invoiceFiles = await prisma.invoiceFile.findMany({
      where: { invoiceId },
      include: { file: true }
    })
    
    const fileNamePattern = `${invoice.type === "estimate" ? "Estimate" : "Invoice"}-${invoice.invoiceNumber}.pdf`
    const oldFiles = invoiceFiles.filter(row => row.file.filename === fileNamePattern)
    
    const { deleteFile } = await import("@/lib/services/files")
    for (const old of oldFiles) {
      await deleteFile(old.fileId, org.id)
    }

    const formData = invoiceToFormData(invoice, org, settings)
    const pdfElement = createElement(InvoicePDF as any, { data: formData })
    const buffer = await renderToBuffer(pdfElement as any)

    const fileName = `Invoice-${invoice.invoiceNumber}.pdf`
    const filePathBuilder = invoice.type === "bill" ? getBillFilePath : getInvoiceFilePath
    const { randomUUID } = await import("crypto")
    const fileUuid = randomUUID()
    const storagePath = filePathBuilder(org.id, fileUuid, fileName, invoice.issuedAt || new Date())

    const { getStorage } = await import("@/lib/storage")
    await getStorage().put(storagePath, Buffer.from(buffer))

    const fileRecord = await prisma.file.create({
      data: {
        id: fileUuid,
        filename: fileName,
        path: storagePath,
        mimetype: "application/pdf",
        size: buffer.length,
        isReviewed: true,
        userId: user.id,
        organizationId: org.id,
        metadata: { size: buffer.length },
      },
    })

    await attachFileToInvoice(invoice.id, fileRecord.id)

    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true, fileId: fileRecord.id }
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    return { error: "Failed to generate invoice PDF" }
  }
}

export async function convertEstimateToInvoiceAction(estimateId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const estimate = await getInvoiceById(estimateId, org.id)

  if (!estimate) return { error: "Estimate not found" }

  const invoiceNumber = await getNextInvoiceNumber(org.id, "sales")

  await createInvoice(org.id, {
    invoiceNumber,
    type: "sales",
    contactId: estimate.contactId || undefined,
    clientName: estimate.clientName,
    clientEmail: estimate.clientEmail || undefined,
    clientAddress: estimate.clientAddress || undefined,
    clientTaxId: estimate.clientTaxId || undefined,
    items: estimate.items?.map((item: any) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      taxId: item.taxId,
      taxAmount: item.taxAmount,
    })),
    subtotal: estimate.subtotal,
    taxTotal: estimate.taxTotal || 0,
    total: estimate.total,
    currency: estimate.currency,
    issuedAt: new Date(),
    dueAt: estimate.dueAt || undefined,
    notes: estimate.notes || undefined,
  })

  // Mark estimate as accepted
  await updateInvoice(estimateId, org.id, { status: "paid" })

  revalidatePath("/invoices")
  revalidatePath("/estimates")
  return { success: true }
}

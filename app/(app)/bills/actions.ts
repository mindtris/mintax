"use server"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import {
  createBill,
  updateBill,
  deleteBill,
  markBillPaid,
  getNextBillNumber,
} from "@/lib/services/bills"
import { sendPaymentMadeEmail, sendBillEmail } from "@/lib/integrations/email"
import { getSettings } from "@/lib/services/settings"
import { getBillFilePath } from "@/lib/files"
import { uploadAndCreateFile, attachFileToBill } from "@/lib/services/files"
import { prisma } from "@/lib/core/db"
import { format } from "date-fns"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function generateAndAttachBillPDFAction(billId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const { getBillById } = await import("@/lib/services/bills")
  const bill = await getBillById(billId, org.id)
  if (!bill) return { error: "Bill not found" }

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { createElement } = await import("react")
    const { InvoicePDF } = await import("@/components/invoices/invoice-pdf")
    const { getSettings } = await import("@/lib/services/settings")
    const { invoiceToFormData } = await import("@/components/invoices/templates")

    const settings = await getSettings(org.id)
    // Map bill to invoice-like form data for rendering
    const formData = invoiceToFormData(
      {
        ...bill,
        invoiceNumber: bill.billNumber,
        type: "purchase",
        clientName: bill.vendorName,
        clientEmail: bill.vendorEmail,
        clientAddress: bill.vendorAddress,
        clientTaxId: bill.vendorTaxId,
      },
      org,
      settings
    )

    const pdfBuffer = await renderToBuffer(createElement(InvoicePDF as any, { data: formData }) as any)

    // Create file record
    const { randomUUID } = await import("crypto")
    const filename = `bill-${bill.billNumber}.pdf`
    const issuedDate = bill.issuedAt || new Date()
    const storagePath = getBillFilePath(org.id, randomUUID(), filename, issuedDate)

    const { uploadAndCreateFile, attachFileToBill } = await import("@/lib/services/files")
    
    // We need to convert Buffer to File-like or use a lower-level service
    // For now, let's use the buffer directly if uploadAndCreateFile supports it (or adapt it)
    // Actually, uploadAndCreateFile expects a File object in most cases, but we can wrap it.
    const fileRecord = await prisma.file.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        filename,
        path: storagePath,
        size: pdfBuffer.length,
        mimetype: "application/pdf",
      },
    })

    const { getStorage } = await import("@/lib/storage")
    await getStorage().put(storagePath, pdfBuffer)

    await attachFileToBill(bill.id, fileRecord.id)

    revalidatePath(`/bills/${billId}`)
    return { success: true, fileId: fileRecord.id }
  } catch (error: any) {
    console.error("Failed to generate bill PDF:", error)
    return { error: "Failed to generate PDF: " + error.message }
  }
}

export async function sendBillAction(billId: string, attachPdf: boolean = true) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const { getBillById } = await import("@/lib/services/bills")
  const [bill, emailSettings] = await Promise.all([
    getBillById(billId, org.id),
    getSettings(org.id),
  ])

  if (!bill) return { error: "Bill not found" }
  if (!bill.vendorEmail) return { error: "Vendor email is required to send" }

  try {
    let pdfAttachment = undefined

    if (attachPdf) {
      const { renderToBuffer } = await import("@react-pdf/renderer")
      const { createElement } = await import("react")
      const { InvoicePDF } = await import("@/components/invoices/invoice-pdf")
      const { invoiceToFormData } = await import("@/components/invoices/templates")

      const formData = invoiceToFormData(
        {
          ...bill,
          invoiceNumber: bill.billNumber,
          type: "purchase",
          clientName: bill.vendorName,
          clientEmail: bill.vendorEmail,
          clientAddress: bill.vendorAddress,
          clientTaxId: bill.vendorTaxId,
        },
        org,
        emailSettings
      )

      const buffer = await renderToBuffer(createElement(InvoicePDF as any, { data: formData }) as any)

      pdfAttachment = {
        filename: `Bill-${bill.billNumber}.pdf`,
        content: new Uint8Array(buffer),
        contentType: "application/pdf",
      }

      // Also persist the PDF as a File record attached to the bill
      const { randomUUID } = await import("crypto")
      const fileUuid = randomUUID()
      const issuedDate = bill.issuedAt || new Date()
      const storagePath = getBillFilePath(org.id, fileUuid, pdfAttachment.filename, issuedDate)

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

      await attachFileToBill(bill.id, fileRecord.id)
    }

    await sendBillEmail({
      orgId: org.id,
      email: bill.vendorEmail,
      billNumber: bill.billNumber,
      vendorName: bill.vendorName,
      total: (bill.total / 100).toFixed(2),
      currency: bill.currency,
      dueDate: bill.dueAt ? format(bill.dueAt, "MMMM d, yyyy") : "Not specified",
      orgName: org.name,
      notes: bill.notes,
      emailSettings,
      pdfAttachment,
    })

    await updateBill(billId, org.id, { status: "sent" })

    revalidatePath("/accounts")
    revalidatePath(`/bills/${billId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to send bill:", error)
    return { error: "Failed to send bill email" }
  }
}

export async function createBillAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const contactId = (formData.get("contactId") as string) || undefined
  const vendorName = formData.get("vendorName") as string
  const vendorEmail = formData.get("vendorEmail") as string
  const vendorAddress = formData.get("vendorAddress") as string
  const vendorTaxId = formData.get("vendorTaxId") as string
  const subtotal = Math.round(parseFloat(formData.get("subtotal") as string || "0") * 100)
  const taxTotal = Math.round(parseFloat(formData.get("taxTotal") as string || "0") * 100)
  const total = Math.round(parseFloat(formData.get("total") as string || "0") * 100)
  const currency = formData.get("currency") as string || org.baseCurrency
  const issuedAt = formData.get("issuedAt") as string
  const dueAt = formData.get("dueAt") as string
  const notes = formData.get("notes") as string
  const itemsJson = formData.get("items") as string
  const files = formData.getAll("files") as File[]

  if (!vendorName || vendorName.trim().length < 1) {
    return { error: "Vendor name is required" }
  }

  // Parse line items
  let items: any[] | undefined
  if (itemsJson) {
    try {
      const parsed = JSON.parse(itemsJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed
          .filter((item: any) => item.name || item.itemId)
          .map((item: any) => ({
            name: item.name || "Untitled Item",
            description: item.description || undefined,
            quantity: item.quantity || 1,
            price: item.price || 0,
            total: item.total || 0,
            itemId: item.itemId || undefined,
            taxId: item.taxId || undefined,
            taxAmount: item.taxAmount || 0,
          }))
      }
    } catch {}
  }

  const billNumber = await getNextBillNumber(org.id)
  const issuedDate = issuedAt ? new Date(issuedAt) : new Date()

  const bill = await createBill(org.id, {
    billNumber,
    ...(contactId ? { contactId } : {}),
    vendorName: vendorName.trim(),
    vendorEmail: vendorEmail || undefined,
    vendorAddress: vendorAddress || undefined,
    vendorTaxId: vendorTaxId || undefined,
    items,
    subtotal,
    taxTotal,
    total: total || subtotal + taxTotal,
    currency,
    issuedAt: issuedDate,
    dueAt: dueAt ? new Date(dueAt) : undefined,
    notes: notes || undefined,
  })

  // Upload bill attachments under {orgId}/bills/{YYYY}/{MM}/...
  for (const file of files) {
    if (file && file.size > 0) {
      try {
        const { randomUUID } = await import("crypto")
        const storagePath = getBillFilePath(org.id, randomUUID(), file.name, issuedDate)
        const fileRecord = await uploadAndCreateFile(org.id, user.id, file, storagePath)
        await attachFileToBill(bill.id, fileRecord.id)
      } catch (err) {
        console.error("Failed to upload bill file:", err)
      }
    }
  }

  revalidatePath("/accounts")
  redirect("/accounts?tab=bills")
}

export async function updateBillAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const billId = formData.get("billId") as string

  const status = formData.get("status") as string
  const contactId = (formData.get("contactId") as string) || undefined
  const vendorName = formData.get("vendorName") as string
  const vendorEmail = formData.get("vendorEmail") as string
  const vendorAddress = formData.get("vendorAddress") as string
  const vendorTaxId = formData.get("vendorTaxId") as string
  const subtotal = Math.round(parseFloat(formData.get("subtotal") as string || "0") * 100)
  const taxTotal = Math.round(parseFloat(formData.get("taxTotal") as string || "0") * 100)
  const total = Math.round(parseFloat(formData.get("total") as string || "0") * 100)
  const currency = formData.get("currency") as string || org.baseCurrency
  const issuedAt = formData.get("issuedAt") as string
  const dueAt = formData.get("dueAt") as string
  const notes = formData.get("notes") as string

  if (!vendorName || vendorName.trim().length < 1) {
    return { error: "Vendor name is required" }
  }

  await updateBill(billId, org.id, {
    status: status || undefined,
    ...(contactId ? { contactId } : {}),
    vendorName: vendorName.trim(),
    vendorEmail: vendorEmail || undefined,
    vendorAddress: vendorAddress || undefined,
    vendorTaxId: vendorTaxId || undefined,
    subtotal,
    taxTotal,
    total: total || subtotal + taxTotal,
    currency,
    issuedAt: issuedAt ? new Date(issuedAt) : undefined,
    dueAt: dueAt ? new Date(dueAt) : undefined,
    notes: notes || undefined,
  })

  revalidatePath("/accounts")
  revalidatePath(`/accounts?tab=bills`)
  redirect("/accounts?tab=bills")
}

export async function markBillPaidAction(billId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const { getBillById } = await import("@/lib/services/bills")
  const bill = await getBillById(billId, org.id)

  if (!bill) return { error: "Bill not found" }

  // Auto-create transaction from paid bill
  const { createTransactionFromBill } = await import("@/lib/services/automation")
  const transaction = await createTransactionFromBill(org.id, user.id, {
    id: bill.id,
    billNumber: bill.billNumber,
    vendorName: bill.vendorName,
    total: bill.total,
    currency: bill.currency,
    issuedAt: bill.issuedAt,
    notes: bill.notes,
  })

  await markBillPaid(billId, org.id, transaction.id)

  // Send payment made email to vendor
  if (bill.vendorEmail) {
    try {
      const emailSettings = await getSettings(org.id)
      await sendPaymentMadeEmail({
        email: bill.vendorEmail,
        referenceNumber: bill.billNumber,
        vendorName: bill.vendorName,
        total: (bill.total / 100).toFixed(2),
        currency: bill.currency,
        paidDate: format(new Date(), "MMMM d, yyyy"),
        orgName: org.name,
        emailSettings,
      })
    } catch (emailError) {
      console.error("Failed to send payment made email:", emailError)
    }
  }

  revalidatePath("/accounts")
}

export async function deleteBillAction(billId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  await deleteBill(billId, org.id)
  revalidatePath("/accounts")
}

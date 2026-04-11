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
  const notes = formData.get("notes") as string

  if (!clientName || clientName.trim().length < 1) {
    return { error: "Client name is required" }
  }

  const invoiceNumber = await getNextInvoiceNumber(org.id, type || "sales")

  await createInvoice(org.id, {
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
    issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
    dueAt: dueAt ? new Date(dueAt) : undefined,
    notes: notes || undefined,
  })

  revalidatePath("/invoices")
  revalidatePath("/estimates")
  redirect(type === "estimate" ? "/estimates" : "/invoices")
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
  const notes = formData.get("notes") as string

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
    notes: notes || undefined,
  })

  revalidatePath("/invoices")
  revalidatePath("/estimates")
  revalidatePath(`/invoices/${invoiceId}`)
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
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  await deleteInvoice(invoiceId, org.id)
  revalidatePath("/invoices")
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

export async function sendInvoiceAction(invoiceId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const invoice = await getInvoiceById(invoiceId, org.id)

  if (!invoice) return { error: "Invoice not found" }
  if (!invoice.clientEmail) return { error: "Client email is required to send" }

  try {
    const emailSettings = await getSettings(org.id)
    await sendInvoiceEmail({
      email: invoice.clientEmail,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      total: (invoice.total / 100).toFixed(2),
      currency: invoice.currency,
      dueDate: invoice.dueAt ? format(invoice.dueAt, "MMMM d, yyyy") : "Not specified",
      orgName: org.name,
      notes: invoice.notes,
      emailSettings,
    })

    await updateInvoice(invoiceId, org.id, { status: "sent" })

    revalidatePath("/invoices")
    return { success: true }
  } catch (error) {
    console.error("Failed to send invoice:", error)
    return { error: "Failed to send invoice email" }
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

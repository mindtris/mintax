"use server"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import {
  createBill,
  updateBill,
  deleteBill,
  markBillPaid,
  getNextBillNumber,
} from "@/lib/services/bills"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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

  if (!vendorName || vendorName.trim().length < 1) {
    return { error: "Vendor name is required" }
  }

  const billNumber = await getNextBillNumber(org.id)

  await createBill(org.id, {
    billNumber,
    ...(contactId ? { contactId } : {}),
    vendorName: vendorName.trim(),
    vendorEmail: vendorEmail || undefined,
    vendorAddress: vendorAddress || undefined,
    vendorTaxId: vendorTaxId || undefined,
    subtotal,
    taxTotal,
    total: total || subtotal + taxTotal,
    currency,
    issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
    dueAt: dueAt ? new Date(dueAt) : undefined,
    notes: notes || undefined,
  })

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

  revalidatePath("/accounts")
}

export async function deleteBillAction(billId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  await deleteBill(billId, org.id)
  revalidatePath("/accounts")
}

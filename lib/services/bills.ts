import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"

export type BillData = {
  billNumber: string
  status?: string
  contactId?: string            // Link to Vendor Contact
  vendorName: string
  vendorEmail?: string
  vendorAddress?: string
  vendorTaxId?: string
  items?: any[]
  subtotal: number
  taxTotal?: number
  total: number
  currency?: string
  issuedAt?: Date
  dueAt?: Date
  notes?: string
  transactionId?: string
  files?: string[]
}

export type BillFilters = {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export const getBills = cache(async (orgId: string, filters?: BillFilters) => {
  const where: Prisma.BillWhereInput = { organizationId: orgId }

  if (filters) {
    if (filters.search) {
      where.OR = [
        { billNumber: { contains: filters.search, mode: "insensitive" } },
        { vendorName: { contains: filters.search, mode: "insensitive" } },
        { vendorEmail: { contains: filters.search, mode: "insensitive" } },
      ]
    }
    if (filters.status) where.status = filters.status
    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }
  }

  const bills = await prisma.bill.findMany({
    where,
    include: { billItems: true },
    orderBy: { createdAt: "desc" },
  })

  return bills.map((bill: any) => ({
    ...bill,
    items: bill.billItems || []
  }))
})

export const getBillById = cache(async (id: string, orgId: string) => {
  const bill: any = await prisma.bill.findFirst({
    where: { id, organizationId: orgId },
    include: { billItems: true },
  })
  
  if (bill) bill.items = bill.billItems || []
  return bill
})

export async function createBill(orgId: string, data: BillData) {
  const { items, files, ...billFields } = data

  return await prisma.bill.create({
    data: {
      ...billFields,
      files: files ? (files as Prisma.InputJsonValue) : "[]",
      organizationId: orgId,
      billItems: items ? {
        create: items.map(item => ({
          name: item.name || "Untitled Item",
          description: item.description,
          quantity: item.quantity || 1,
          price: item.price || 0,
          total: item.total || 0,
          itemId: item.itemId || undefined,
          taxId: item.taxId || undefined,
          taxAmount: item.taxAmount || 0,
        }))
      } : undefined
    },
    include: { billItems: true }
  })
}

export async function updateBill(id: string, orgId: string, data: Partial<BillData>) {
  const { items, files, ...billFields } = data
  const updateData: any = { ...billFields }
  
  if (files) updateData.files = files as Prisma.InputJsonValue

  if (items) {
    updateData.billItems = {
      deleteMany: {},
      create: items.map(item => ({
        name: item.name || "Untitled Item",
        description: item.description,
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: item.total || 0,
        itemId: item.itemId || undefined,
        taxId: item.taxId || undefined,
        taxAmount: item.taxAmount || 0,
      }))
    }
  }

  return await prisma.bill.update({
    where: { id, organizationId: orgId },
    data: updateData,
    include: { billItems: true }
  })
}

export async function deleteBill(id: string, orgId: string) {
  return await prisma.bill.delete({
    where: { id, organizationId: orgId },
  })
}

export async function markBillPaid(id: string, orgId: string, transactionId?: string) {
  return await prisma.bill.update({
    where: { id, organizationId: orgId },
    data: {
      status: "paid",
      paidAt: new Date(),
      transactionId,
    },
  })
}

export async function getNextBillNumber(orgId: string) {
  const lastBill = await prisma.bill.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    select: { billNumber: true },
  })

  if (!lastBill) {
    return `BILL-001`
  }

  const lastNumber = parseInt(lastBill.billNumber.replace(/\D/g, "")) || 0
  return `BILL-${String(lastNumber + 1).padStart(3, "0")}`
}

export const getOverdueBills = cache(async (orgId: string) => {
  return await prisma.bill.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["pending", "overdue"] },
      dueAt: { lt: new Date() },
    },
    orderBy: { dueAt: "asc" },
  })
})

export const getBillStats = cache(async (orgId: string) => {
  const [totalOutstanding, totalOverdue, totalPaid] = await Promise.all([
    prisma.bill.aggregate({
      where: { organizationId: orgId, status: { in: ["pending", "overdue", "draft"] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.bill.aggregate({
      where: { organizationId: orgId, status: "overdue" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.bill.aggregate({
      where: { organizationId: orgId, status: "paid" },
      _sum: { total: true },
      _count: true,
    }),
  ])

  return {
    outstanding: { total: totalOutstanding._sum.total || 0, count: totalOutstanding._count },
    overdue: { total: totalOverdue._sum.total || 0, count: totalOverdue._count },
    paid: { total: totalPaid._sum.total || 0, count: totalPaid._count },
  }
})

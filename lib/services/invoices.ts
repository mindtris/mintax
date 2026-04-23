import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"

export type InvoiceData = {
  invoiceNumber: string
  type?: string
  status?: string
  contactId?: string            // optional link to Contact record
  clientName: string
  clientEmail?: string
  clientAddress?: string
  clientTaxId?: string
  subject?: string
  description?: string
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

export type InvoiceFilters = {
  search?: string
  status?: string
  type?: string
  dateFrom?: string
  dateTo?: string
}

export const getInvoices = cache(
  async (orgId: string, filters?: InvoiceFilters, options?: { ordering?: string; take?: number; skip?: number }) => {
    const where: Prisma.InvoiceWhereInput = { organizationId: orgId }

    if (filters) {
      if (filters.search) {
        where.OR = [
          { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
          { clientName: { contains: filters.search, mode: "insensitive" } },
          { clientEmail: { contains: filters.search, mode: "insensitive" } },
          { subject: { contains: filters.search, mode: "insensitive" } },
        ]
      }
      if (filters.status && filters.status !== "-") where.status = filters.status
      if (filters.type) where.type = filters.type
      if (filters.dateFrom || filters.dateTo) {
        where.issuedAt = {
          gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
        }
      }
    }

    const orderByMatch = options?.ordering?.match(/^-?(.+)$/)
    let orderByField = orderByMatch ? orderByMatch[1] : "createdAt"
    const orderDirection = options?.ordering?.startsWith("-") ? "desc" : "asc"

    // Prevent invalid field names like "desc" or "asc" from being used as field keys
    if (["desc", "asc"].includes(orderByField)) {
      orderByField = "createdAt"
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { invoiceItems: true },
        orderBy: { [orderByField]: orderDirection },
        take: options?.take,
        skip: options?.skip,
      }),
      prisma.invoice.count({ where }),
    ])

    return {
      items: invoices.map((inv: any) => ({
        ...inv,
        items: inv.invoiceItems || [], // Backward proxy
      })),
      total,
    }
  }
)

export const getInvoiceById = cache(async (id: string, orgId: string) => {
  const inv: any = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: { invoiceItems: true },
  })
  
  if (inv) inv.items = inv.invoiceItems || []
  return inv
})

export async function createInvoice(orgId: string, data: InvoiceData) {
  const { items, files, ...invoiceFields } = data

  return await prisma.invoice.create({
    data: {
      ...invoiceFields,
      files: files ? (files as Prisma.InputJsonValue) : "[]",
      organizationId: orgId,
      invoiceItems: items ? {
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
    include: { invoiceItems: true }
  })
}

export async function updateInvoice(id: string, orgId: string, data: Partial<InvoiceData>) {
  const { items, files, ...invoiceFields } = data
  const updateData: any = { ...invoiceFields }
  
  if (files) updateData.files = files as Prisma.InputJsonValue

  // Handling relational updates requires deleting old and recreating new to prevent complex deltas
  if (items) {
    updateData.invoiceItems = {
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

  return await prisma.invoice.update({
    where: { id, organizationId: orgId },
    data: updateData,
    include: { invoiceItems: true }
  })
}

export async function deleteInvoice(id: string, orgId: string) {
  return await prisma.invoice.delete({
    where: { id, organizationId: orgId },
  })
}

export async function markInvoicePaid(id: string, orgId: string, transactionId?: string) {
  return await prisma.invoice.update({
    where: { id, organizationId: orgId },
    data: {
      status: "paid",
      paidAt: new Date(),
      transactionId,
    },
  })
}

export async function getNextInvoiceNumber(orgId: string, type: string = "sales") {
  // Load custom prefix and digit settings per type
  const prefixKey = type === "estimate" ? "estimate_number_prefix" : "invoice_number_prefix"
  const digitsKey = type === "estimate" ? "estimate_number_digits" : "invoice_number_digits"

  const settings = await prisma.setting.findMany({
    where: { organizationId: orgId, code: { in: [prefixKey, digitsKey] } },
  })
  const settingsMap = Object.fromEntries(settings.map((s) => [s.code, s.value || ""]))

  const defaultPrefix = type === "sales" ? "INV" : type === "estimate" ? "EST" : "BILL"
  const prefix = settingsMap[prefixKey] || defaultPrefix
  const digits = parseInt(settingsMap[digitsKey] || "3") || 3

  const lastInvoice = await prisma.invoice.findFirst({
    where: { organizationId: orgId, type },
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  })

  if (!lastInvoice) {
    return `${prefix}-${String(1).padStart(digits, "0")}`
  }

  const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(/\D/g, "")) || 0
  return `${prefix}-${String(lastNumber + 1).padStart(digits, "0")}`
}

export const getOverdueInvoices = cache(async (orgId: string) => {
  return await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["sent", "overdue"] },
      dueAt: { lt: new Date() },
    },
    orderBy: { dueAt: "asc" },
  })
})

export const getInvoiceStats = cache(async (orgId: string, type: string = "sales") => {
  const [totalOutstanding, totalOverdue, totalPaid] = await Promise.all([
    prisma.invoice.aggregate({
      where: { organizationId: orgId, type, status: { in: ["sent", "overdue", "draft"] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { organizationId: orgId, type, status: "overdue" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { organizationId: orgId, type, status: "paid" },
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

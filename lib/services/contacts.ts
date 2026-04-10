import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ContactType =
  | "client"
  | "vendor"
  | "contractor"
  | "provider"
  | "partner"

export interface ContactFilters {
  type?: ContactType | "all"
  q?: string          // search: name, email, phone, reference
  country?: string
  isActive?: boolean
}

export interface ContactPersonInput {
  id?: string         // present on update
  name: string
  email?: string | null
  phone?: string | null
  role?: string | null
  isPrimary?: boolean
}

export interface ContactInput {
  type: ContactType
  name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  taxId?: string | null
  currency?: string
  reference?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
  avatar?: string | null
  notes?: string | null
  persons?: ContactPersonInput[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildWhereClause(
  orgId: string,
  filters: ContactFilters
): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = {
    organizationId: orgId,
    deletedAt: null, // exclude soft-deleted
  }

  if (filters.type && filters.type !== "all") {
    where.type = filters.type
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  if (filters.country) {
    where.country = filters.country
  }

  if (filters.q) {
    const q = filters.q.trim()
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { taxId: { contains: q, mode: "insensitive" } },
      {
        persons: {
          some: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ]
  }

  return where
}

// ─────────────────────────────────────────────────────────────────────────────
// listContacts — paginated, filterable
// ─────────────────────────────────────────────────────────────────────────────

export async function listContacts(
  orgId: string,
  filters: ContactFilters = {},
  pagination: { limit?: number; offset?: number } = {},
  options?: { ordering?: string }
) {
  const { limit = 50, offset = 0 } = pagination
  const where = buildWhereClause(orgId, filters)

  const orderByMatch = options?.ordering?.match(/^-?(.+)$/)
  const orderByField = orderByMatch ? orderByMatch[1] : "name"
  const orderDirection = options?.ordering?.startsWith("-") ? "desc" : "asc"

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        persons: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        _count: {
          select: { invoices: true, transactions: true },
        },
      },
      orderBy: { [orderByField]: orderDirection },
      take: limit,
      skip: offset,
    }),
    prisma.contact.count({ where }),
  ])

  return { contacts, total }
}

// ─────────────────────────────────────────────────────────────────────────────
// getContact — single contact with full financials
// ─────────────────────────────────────────────────────────────────────────────

export async function getContact(orgId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, organizationId: orgId, deletedAt: null },
    include: {
      persons: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  })

  return contact
}

// ─────────────────────────────────────────────────────────────────────────────
// getContactStats — financial summary for a contact
// ─────────────────────────────────────────────────────────────────────────────

export async function getContactStats(orgId: string, contactId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { contactId, organizationId: orgId },
    select: { status: true, total: true },
  })

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0)
  const totalOutstanding = invoices
    .filter((inv) => ["draft", "sent", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total, 0)
  const totalOverdue = invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0)

  return { totalInvoiced, totalPaid, totalOutstanding, totalOverdue }
}

// ─────────────────────────────────────────────────────────────────────────────
// createContact
// ─────────────────────────────────────────────────────────────────────────────

export async function createContact(orgId: string, data: ContactInput) {
  const { persons = [], ...contactData } = data

  const existing = await prisma.contact.findFirst({
    where: {
      organizationId: orgId,
      name: { equals: contactData.name, mode: "insensitive" },
      deletedAt: null,
    },
  })

  if (existing) {
    throw new Error(`A contact with the name "${contactData.name}" already exists.`)
  }

  const contact = await prisma.contact.create({
    data: {
      organizationId: orgId,
      ...contactData,
      persons: {
        create: persons.map((p, i) => ({
          name: p.name,
          email: p.email ?? null,
          phone: p.phone ?? null,
          role: p.role ?? null,
          isPrimary: p.isPrimary ?? i === 0,
        })),
      },
    },
    include: { persons: true },
  })

  return contact
}

// ─────────────────────────────────────────────────────────────────────────────
// updateContact
// ─────────────────────────────────────────────────────────────────────────────

export async function updateContact(
  orgId: string,
  contactId: string,
  data: ContactInput
) {
  const { persons = [], ...contactData } = data

  // Replace persons: delete all existing, recreate from submitted list.
  // This keeps it simple and avoids partial-update edge cases.
  const contact = await prisma.$transaction(async (tx) => {
    await tx.contactPerson.deleteMany({ where: { contactId } })

    return tx.contact.update({
      where: { id: contactId, organizationId: orgId },
      data: {
        ...contactData,
        updatedAt: new Date(),
        persons: {
          create: persons.map((p, i) => ({
            name: p.name,
            email: p.email ?? null,
            phone: p.phone ?? null,
            role: p.role ?? null,
            isPrimary: p.isPrimary ?? i === 0,
          })),
        },
      },
      include: { persons: true },
    })
  })

  return contact
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteContact — soft delete only
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteContact(orgId: string, contactId: string) {
  // Verify ownership before soft-deleting
  const existing = await prisma.contact.findFirst({
    where: { id: contactId, organizationId: orgId, deletedAt: null },
  })

  if (!existing) {
    throw new Error("Contact not found")
  }

  return prisma.contact.update({
    where: { id: contactId },
    data: { deletedAt: new Date(), isActive: false },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// getDistinctCountries — for the country filter picker
// ─────────────────────────────────────────────────────────────────────────────

export async function getDistinctCountries(orgId: string) {
  const rows = await prisma.contact.findMany({
    where: { organizationId: orgId, deletedAt: null, country: { not: null } },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  })

  return rows.map((r: { country: string | null }) => r.country).filter(Boolean) as string[]
}

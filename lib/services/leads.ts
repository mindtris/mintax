import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export const LEAD_STAGES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const

export type LeadStage = (typeof LEAD_STAGES)[number]

export const LEAD_SOURCES = [
  "website",
  "referral",
  "linkedin",
  "cold_call",
  "advertisement",
  "other",
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

export const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
}

export const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  referral: "Referral",
  linkedin: "LinkedIn",
  cold_call: "Cold call",
  advertisement: "Advertisement",
  other: "Other",
}

export interface LeadFilters {
  search?: string
  stage?: string
  source?: string
}

export interface LeadInput {
  title: string
  contactName: string
  email?: string | null
  phone?: string | null
  company?: string | null
  stage?: string
  source?: string | null
  value?: number
  currency?: string
  probability?: number
  assignedToId?: string | null
  description?: string | null
  expectedCloseAt?: string | Date | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

export const getLeads = cache(async (
  orgId: string,
  filters?: LeadFilters,
  options?: { ordering?: string }
) => {
  const where: Prisma.LeadWhereInput = {
    organizationId: orgId,
  }

  if (filters?.search) {
    const q = filters.search
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
    ]
  }

  if (filters?.stage && filters.stage !== "-") {
    where.stage = filters.stage
  }

  if (filters?.source && filters.source !== "-") {
    where.source = filters.source
  }

  let orderBy: Prisma.LeadOrderByWithRelationInput = { createdAt: "desc" }
  if (options?.ordering) {
    const isDesc = options.ordering.startsWith("-")
    const field = isDesc ? options.ordering.slice(1) : options.ordering
    orderBy = { [field]: isDesc ? "desc" : "asc" }
  }

  return prisma.lead.findMany({
    where,
    orderBy,
  })
})

export const getLeadById = cache(async (id: string, orgId: string) => {
  return prisma.lead.findFirst({
    where: { id, organizationId: orgId },
    include: { contact: true },
  })
})

export const getLeadStats = cache(async (orgId: string) => {
  const leads = await prisma.lead.findMany({
    where: { organizationId: orgId },
    select: { stage: true, value: true },
  })

  const total = leads.length
  const open = leads.filter((l) => !["won", "lost"].includes(l.stage)).length
  const won = leads.filter((l) => l.stage === "won").length
  const lost = leads.filter((l) => l.stage === "lost").length
  const pipelineValue = leads
    .filter((l) => !["won", "lost"].includes(l.stage))
    .reduce((sum, l) => sum + l.value, 0)
  const wonValue = leads
    .filter((l) => l.stage === "won")
    .reduce((sum, l) => sum + l.value, 0)

  return { total, open, won, lost, pipelineValue, wonValue }
})

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export async function createLead(orgId: string, data: LeadInput) {
  return prisma.lead.create({
    data: {
      organizationId: orgId,
      title: data.title,
      contactName: data.contactName,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      stage: data.stage || "new",
      source: data.source || null,
      value: data.value || 0,
      currency: data.currency || "INR",
      probability: data.probability || 0,
      assignedToId: data.assignedToId || null,
      description: data.description || null,
      expectedCloseAt: data.expectedCloseAt ? new Date(data.expectedCloseAt) : null,
    },
  })
}

export async function updateLead(id: string, orgId: string, data: Partial<LeadInput>) {
  return prisma.lead.update({
    where: { id, organizationId: orgId },
    data: {
      ...data,
      expectedCloseAt: data.expectedCloseAt ? new Date(data.expectedCloseAt) : undefined,
    },
  })
}

export async function deleteLead(id: string, orgId: string) {
  return prisma.lead.delete({
    where: { id, organizationId: orgId },
  })
}

export async function updateLeadStage(id: string, orgId: string, stage: string) {
  const data: any = { stage }
  if (stage === "won") {
    data.probability = 100
  }
  if (stage === "lost") {
    data.probability = 0
  }
  return prisma.lead.update({
    where: { id, organizationId: orgId },
    data,
  })
}

export async function convertLeadToContact(id: string, orgId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: orgId },
  })
  if (!lead) throw new Error("Lead not found")

  const contact = await prisma.contact.create({
    data: {
      organizationId: orgId,
      type: "client",
      name: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      notes: `Converted from lead: ${lead.title}`,
    },
  })

  await prisma.lead.update({
    where: { id },
    data: {
      stage: "won",
      probability: 100,
      contactId: contact.id,
      convertedAt: new Date(),
    },
  })

  return contact
}

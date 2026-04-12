import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export const LEAD_SOURCES = [
  "website",
  "referral",
  "linkedin",
  "cold_call",
  "advertisement",
  "other",
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

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
  const [leads, categories] = await Promise.all([
    prisma.lead.findMany({
      where: { organizationId: orgId },
      select: { stage: true, value: true },
    }),
    prisma.category.findMany({
      where: { organizationId: orgId, type: "sales" }
    })
  ])

  const total = leads.length
  
  // Dynamic resolution of special stages
  const wonCodes = categories.filter(c => c.code?.includes("won") || c.name.toLowerCase().includes("won")).map(c => c.code)
  const lostCodes = categories.filter(c => c.code?.includes("lost") || c.name.toLowerCase().includes("lost")).map(c => c.code)
  
  const won = leads.filter((l) => wonCodes.includes(l.stage)).length
  const lost = leads.filter((l) => lostCodes.includes(l.stage)).length
  const open = leads.filter((l) => !wonCodes.includes(l.stage) && !lostCodes.includes(l.stage)).length

  const pipelineValue = leads
    .filter((l) => !wonCodes.includes(l.stage) && !lostCodes.includes(l.stage))
    .reduce((sum, l) => sum + l.value, 0)
    
  const wonValue = leads
    .filter((l) => wonCodes.includes(l.stage))
    .reduce((sum, l) => sum + l.value, 0)

  return { total, open, won, lost, pipelineValue, wonValue }
})

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export async function createLead(orgId: string, data: LeadInput) {
  const defaultStage = data.stage || (await prisma.category.findFirst({
    where: { organizationId: orgId, type: "sales" },
    orderBy: { name: "asc" }
  }))?.code || "new"

  return prisma.lead.create({
    data: {
      organizationId: orgId,
      title: data.title,
      contactName: data.contactName,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      stage: defaultStage,
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
  
  // Dynamically resolve if the new stage is a winning or losing stage
  const category = await prisma.category.findFirst({
    where: { organizationId: orgId, type: "sales", code: stage }
  })

  if (category) {
    const code = (category.code ?? "").toLowerCase()
    const name = category.name.toLowerCase()
    if (code.includes("won") || name.includes("won")) {
      data.probability = 100
    } else if (code.includes("lost") || name.includes("lost")) {
      data.probability = 0
    }
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

  // Find a "won" stage dynamically
  const wonCategory = await prisma.category.findFirst({
    where: { 
      organizationId: orgId, 
      type: "sales", 
      OR: [
        { code: { contains: "won", mode: "insensitive" } },
        { name: { contains: "won", mode: "insensitive" } }
      ]
    }
  })

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
      stage: wonCategory?.code || lead.stage,
      probability: 100,
      contactId: contact.id,
      convertedAt: new Date(),
    },
  })

  return contact
}

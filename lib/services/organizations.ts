import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import slugify from "slugify"
import { cache } from "react"
import { createOrgDefaults } from "./defaults"

export type CreateOrgData = {
  name: string
  type?: string
  baseCurrency?: string
  address?: string
  taxId?: string
}

export const getOrganizationById = cache(async (id: string) => {
  return await prisma.organization.findUnique({
    where: { id },
  })
})

export const getOrganizationBySlug = cache(async (slug: string) => {
  return await prisma.organization.findUnique({
    where: { slug },
  })
})

export const getOrganizationsForUser = cache(async (userId: string) => {
  const memberships = await prisma.orgMember.findMany({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })
  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }))
})

export const getUserRole = cache(async (userId: string, orgId: string) => {
  const membership = await prisma.orgMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  })
  return membership?.role ?? null
})

export async function createOrganization(userId: string, data: CreateOrgData) {
  const slug = slugify(data.name, { lower: true, strict: true })

  // Ensure unique slug
  let finalSlug = slug
  let counter = 1
  while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${counter}`
    counter++
  }

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      slug: finalSlug,
      type: data.type || "business",
      baseCurrency: data.baseCurrency || "INR",
      address: data.address,
      taxId: data.taxId,
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  })

  // Seed default data for the new org
  await createOrgDefaults(org.id, org.type)

  return org
}

export async function updateOrganization(orgId: string, data: Prisma.OrganizationUpdateInput) {
  return await prisma.organization.update({
    where: { id: orgId },
    data,
  })
}

export async function deleteOrganization(orgId: string) {
  return await prisma.organization.delete({
    where: { id: orgId },
  })
}

export const getOrgMembers = cache(async (orgId: string) => {
  return await prisma.orgMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })
})

export async function addOrgMember(orgId: string, userId: string, role: string = "member") {
  return await prisma.orgMember.create({
    data: {
      organizationId: orgId,
      userId,
      role,
    },
  })
}

export async function updateOrgMemberRole(orgId: string, userId: string, role: string) {
  return await prisma.orgMember.update({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    data: { role },
  })
}

export async function removeOrgMember(orgId: string, userId: string) {
  return await prisma.orgMember.delete({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  })
}

import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"
import { createOrgDefaults } from "./defaults"

export const SELF_HOSTED_USER = {
  email: "admin@mintax.local",
  name: "Admin",
  membershipPlan: "unlimited",
}

export const getSelfHostedUser = cache(async () => {
  if (!process.env.DATABASE_URL) {
    return null // fix for CI, do not remove
  }

  return await prisma.user.findFirst({
    where: { email: SELF_HOSTED_USER.email },
  })
})

export const getOrCreateSelfHostedUser = cache(async () => {
  const user = await prisma.user.upsert({
    where: { email: SELF_HOSTED_USER.email },
    update: SELF_HOSTED_USER,
    create: SELF_HOSTED_USER,
  })

  // Ensure user has at least one organization
  const memberships = await prisma.orgMember.findMany({
    where: { userId: user.id },
  })

  if (memberships.length === 0) {
    const org = await prisma.organization.create({
      data: {
        name: "My Business",
        slug: "my-business",
        type: "business",
        baseCurrency: "INR",
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    })
    await createOrgDefaults(org.id, org.type)
  }

  return user
})

export async function getOrCreateCloudUser(email: string, data: Prisma.UserCreateInput) {
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: data,
    create: data,
  })

  // Ensure user has at least one organization
  const memberships = await prisma.orgMember.findMany({
    where: { userId: user.id },
  })

  if (memberships.length === 0) {
    const org = await prisma.organization.create({
      data: {
        name: "My Business",
        slug: `org-${user.id.slice(0, 8)}`,
        type: "business",
        baseCurrency: "INR",
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    })
    await createOrgDefaults(org.id, org.type)
  }

  return user
}

export const getUserById = cache(async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  })
})

export const getUserByEmail = cache(async (email: string) => {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
})

export const getUserByStripeCustomerId = cache(async (customerId: string) => {
  return await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })
})

export function updateUser(userId: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
  })
}

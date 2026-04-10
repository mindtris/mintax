import { prisma } from "@/lib/core/db"
import { cache } from "react"

export const getSocialAccounts = cache(async (orgId: string) => {
  return await prisma.socialAccount.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  })
})

export const getSocialAccountById = cache(async (id: string, orgId: string) => {
  return await prisma.socialAccount.findFirst({
    where: { id, organizationId: orgId },
  })
})

export const getSocialAccountsByProvider = cache(async (orgId: string, provider: string) => {
  return await prisma.socialAccount.findMany({
    where: { organizationId: orgId, provider },
    orderBy: { createdAt: "desc" },
  })
})

export const getActiveSocialAccounts = cache(async (orgId: string) => {
  return await prisma.socialAccount.findMany({
    where: { organizationId: orgId, disabled: false },
    orderBy: { createdAt: "desc" },
  })
})

export async function createSocialAccount(
  orgId: string,
  data: {
    provider: string
    providerAccountId: string
    name: string
    username?: string
    picture?: string
    accessToken: string
    refreshToken?: string
    tokenExpiresAt?: Date
    scopes?: string
    metadata?: any
  }
) {
  return await prisma.socialAccount.upsert({
    where: {
      organizationId_provider_providerAccountId: {
        organizationId: orgId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
      },
    },
    update: {
      name: data.name,
      username: data.username,
      picture: data.picture,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      scopes: data.scopes,
      metadata: data.metadata,
      disabled: false,
      refreshNeeded: false,
    },
    create: {
      organizationId: orgId,
      ...data,
    },
  })
}

export async function updateSocialAccountTokens(
  id: string,
  orgId: string,
  tokens: {
    accessToken: string
    refreshToken?: string
    tokenExpiresAt?: Date
  }
) {
  return await prisma.socialAccount.update({
    where: { id, organizationId: orgId },
    data: {
      ...tokens,
      refreshNeeded: false,
    },
  })
}

export async function disableSocialAccount(id: string, orgId: string) {
  return await prisma.socialAccount.update({
    where: { id, organizationId: orgId },
    data: { disabled: true },
  })
}

export async function deleteSocialAccount(id: string, orgId: string) {
  return await prisma.socialAccount.delete({
    where: { id, organizationId: orgId },
  })
}

export async function markRefreshNeeded(id: string) {
  return await prisma.socialAccount.update({
    where: { id },
    data: { refreshNeeded: true },
  })
}

export async function getAccountsNeedingRefresh() {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
  return await prisma.socialAccount.findMany({
    where: {
      disabled: false,
      OR: [
        { refreshNeeded: true },
        { tokenExpiresAt: { lt: fiveMinutesFromNow } },
      ],
    },
  })
}

export const getSocialAccountCount = cache(async (orgId: string) => {
  return await prisma.socialAccount.count({
    where: { organizationId: orgId, disabled: false },
  })
})

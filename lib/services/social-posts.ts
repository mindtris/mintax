import { prisma } from "@/lib/core/db"
import { Prisma } from "@/lib/prisma/client"
import { randomUUID } from "crypto"
import { cache } from "react"

export type SocialPostFilters = {
  status?: string
  provider?: string
  contentType?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export const getSocialPosts = cache(
  async (orgId: string, filters?: SocialPostFilters, options?: { ordering?: string; take?: number; skip?: number }) => {
    const where: Prisma.SocialPostWhereInput = { organizationId: orgId }

    if (filters) {
      if (filters.status && filters.status !== "-") where.status = filters.status
      if (filters.contentType === "social") {
        where.contentType = { in: ["post", "article", "newsletter", "page", "thread", "social"] }
      } else if (filters.contentType) {
        where.contentType = filters.contentType
      }
      if (filters.provider && filters.provider !== "-") {
        where.socialAccount = { provider: filters.provider }
      }
      if (filters.search) {
        where.OR = [
          { content: { contains: filters.search, mode: "insensitive" } },
          { title: { contains: filters.search, mode: "insensitive" } },
        ]
      }
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {
          gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
        }
      }
    }

    const orderByMatch = options?.ordering?.match(/^-?(.+)$/)
    const orderByField = orderByMatch ? orderByMatch[1] : "createdAt"
    const orderDirection = options?.ordering?.startsWith("-") ? "desc" : "asc"

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        include: {
          socialAccount: true,
          media: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { [orderByField]: orderDirection },
        take: options?.take,
        skip: options?.skip,
      }),
      prisma.socialPost.count({ where }),
    ])

    return {
      items: posts,
      total,
    }
  }
)

export const getSocialPostById = cache(async (id: string, orgId: string) => {
  return await prisma.socialPost.findFirst({
    where: { id, organizationId: orgId },
    include: {
      socialAccount: true,
      media: { orderBy: { sortOrder: "asc" } },
      analytics: { orderBy: { date: "desc" } },
    },
  })
})

export const getSocialPostsByGroup = cache(async (group: string, orgId: string) => {
  return await prisma.socialPost.findMany({
    where: { group, organizationId: orgId },
    include: {
      socialAccount: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
  })
})

export const getScheduledPosts = cache(async (orgId: string, from: Date, to: Date) => {
  return await prisma.socialPost.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["queued", "published"] },
      OR: [
        { scheduledAt: { gte: from, lte: to } },
        { publishedAt: { gte: from, lte: to } },
      ],
    },
    include: { socialAccount: true },
    orderBy: { scheduledAt: "asc" },
  })
})

export const getUpcomingPosts = cache(async (orgId: string, limit: number = 5) => {
  return await prisma.socialPost.findMany({
    where: {
      organizationId: orgId,
      status: "queued",
      scheduledAt: { gt: new Date() },
    },
    include: { socialAccount: true },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  })
})

export const getRecentPublished = cache(async (orgId: string, limit: number = 5) => {
  return await prisma.socialPost.findMany({
    where: {
      organizationId: orgId,
      status: "published",
    },
    include: { socialAccount: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  })
})

/** Called by cron — no orgId, finds all due posts globally */
export async function getDuePostsForPublishing() {
  return await prisma.socialPost.findMany({
    where: {
      status: "queued",
      scheduledAt: { lte: new Date() },
    },
    include: { socialAccount: true },
    orderBy: { scheduledAt: "asc" },
  })
}

export async function createSocialPost(
  orgId: string,
  userId: string,
  data: {
    socialAccountId: string
    content: string
    contentType?: string
    title?: string
    excerpt?: string
    slug?: string
    tags?: string[]
    status?: string
    scheduledAt?: Date | null
    settings?: any
    templateId?: string
    group?: string
  }
) {
  const defaultContentType = data.contentType || (await prisma.category.findFirst({
    where: { organizationId: orgId, type: "engage" },
    orderBy: { name: "asc" }
  }))?.code || "post"

  return await prisma.socialPost.create({
    data: {
      organizationId: orgId,
      createdById: userId,
      socialAccountId: data.socialAccountId,
      content: data.content,
      contentType: defaultContentType,
      title: data.title,
      excerpt: data.excerpt,
      slug: data.slug,
      tags: data.tags || [],
      status: data.status || "draft",
      scheduledAt: data.scheduledAt,
      settings: data.settings,
      templateId: data.templateId,
      group: data.group || randomUUID(),
    },
  })
}

/** Creates one SocialPost per account with a shared group UUID */
export async function createMultiPlatformPost(
  orgId: string,
  userId: string,
  data: {
    content: string
    contentType?: string
    title?: string
    excerpt?: string
    slug?: string
    tags?: string[]
    status?: string
    scheduledAt?: Date | null
    settings?: any
    accountSettings?: Record<string, any>
    templateId?: string
    mediaUrls?: string[]
    mediaIds?: string[]
    comments?: { content: string; delayMinutes: number; mediaUrls?: string[] }[]
  },
  accountIds: string[]
) {
  const group = randomUUID()
  const defaultContentType = data.contentType || (await prisma.category.findFirst({
    where: { organizationId: orgId, type: "engage" },
    orderBy: { name: "asc" }
  }))?.code || "post"

  const posts = await Promise.all(
    accountIds.map((accountId) =>
      prisma.socialPost.create({
        data: {
          organizationId: orgId,
          createdById: userId,
          socialAccountId: accountId,
          content: data.content,
          contentType: defaultContentType,
          title: data.title,
          excerpt: data.excerpt,
          slug: data.slug,
          tags: data.tags || [],
          status: data.status || "draft",
          scheduledAt: data.scheduledAt,
          settings: data.accountSettings?.[accountId] || data.settings,
          templateId: data.templateId,
          hasComments: data.comments && data.comments.length > 0,
          group,
          media: data.mediaUrls && data.mediaUrls.length > 0 ? {
            create: data.mediaUrls.map((url, index) => ({
              url,
              fileId: data.mediaIds?.[index],
              type: url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image",
              sortOrder: index
            }))
          } : undefined,
          comments: data.comments && data.comments.length > 0 ? {
            create: data.comments.map((c, index) => ({
              content: c.content,
              delayMinutes: c.delayMinutes,
              order: index + 1,
              status: "pending",
            }))
          } : undefined
        },
      })
    )
  )

  return { group, posts }
}

export async function updateSocialPost(
  id: string,
  orgId: string,
  data: {
    content?: string
    contentType?: string
    title?: string
    excerpt?: string
    slug?: string
    tags?: string[]
    status?: string
    scheduledAt?: Date | null
    settings?: any
  }
) {
  return await prisma.socialPost.update({
    where: { id, organizationId: orgId },
    data,
  })
}

export async function deleteSocialPost(id: string, orgId: string) {
  return await prisma.socialPost.delete({
    where: { id, organizationId: orgId },
  })
}

export async function deletePostGroup(group: string, orgId: string) {
  return await prisma.socialPost.deleteMany({
    where: { group, organizationId: orgId },
  })
}

export async function markPublished(id: string, externalPostId: string | null, externalUrl: string | null) {
  return await prisma.socialPost.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
      externalPostId,
      externalUrl,
      error: null,
    },
  })
}

export async function markPublishing(id: string) {
  return await prisma.socialPost.update({
    where: { id },
    data: { status: "publishing" },
  })
}

export async function markError(id: string, error: string) {
  return await prisma.socialPost.update({
    where: { id },
    data: { status: "error", error },
  })
}

export const getPostStats = cache(async (orgId: string) => {
  const results = await prisma.socialPost.groupBy({
    by: ["status"],
    where: { organizationId: orgId },
    _count: true,
  })

  return results.reduce(
    (acc, r) => {
      acc[r.status] = r._count
      return acc
    },
    {} as Record<string, number>
  )
})

export const getPostCountThisWeek = cache(async (orgId: string) => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  return await prisma.socialPost.count({
    where: {
      organizationId: orgId,
      createdAt: { gte: weekAgo },
    },
  })
})

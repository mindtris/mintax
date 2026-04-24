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
      } else if (filters.contentType === "content") {
        where.contentType = { in: ["blog", "doc", "help", "changelog"] }
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

    // Unified where for EngagePost
    const engageWhere: any = { organizationId: orgId }
    if (filters) {
      if (filters.status && filters.status !== "-") engageWhere.status = filters.status
      if (filters.contentType && !["social", "content"].includes(filters.contentType)) {
         engageWhere.type = filters.contentType
      } else if (filters.contentType === "content") {
         engageWhere.type = { in: ["blog", "doc", "help", "changelog"] }
      }
      if (filters.search) {
        engageWhere.OR = [
          { content: { contains: filters.search, mode: "insensitive" } },
          { title: { contains: filters.search, mode: "insensitive" } },
        ]
      }
    }

    const [socialData, engageData] = await Promise.all([
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
      prisma.engagePost.findMany({
        where: engageWhere,
        include: { user: true },
        orderBy: { [orderByField === "createdAt" ? "createdAt" : (orderByField as any)]: orderDirection },
        take: options?.take,
        skip: options?.skip,
      }),
      prisma.socialPost.count({ where }),
      prisma.engagePost.count({ where: engageWhere }),
    ])

    const socialPosts = socialData
    const engagePosts = engageData.map(p => ({
      ...p,
      contentType: p.type, // Map 'type' to 'contentType' for UI compatibility
      content: p.title || p.content.replace(/<[^>]*>/g, '').slice(0, 100), // Strip HTML for summary
      socialAccount: { provider: "Website", name: "Website" }, // Placeholder for UI
      group: p.id // Individual ID as group ID
    }))

    // Combine and sort
    const combined = [...socialPosts, ...engagePosts]
      .sort((a: any, b: any) => {
        const valA = a[orderByField]
        const valB = b[orderByField]
        if (orderDirection === "desc") return valB > valA ? 1 : -1
        return valA > valB ? 1 : -1
      })
      .slice(0, options?.take || 50)

    const totalSocial = await prisma.socialPost.count({ where })
    const totalEngage = await prisma.engagePost.count({ where: engageWhere })

    return {
      items: combined,
      total: totalSocial + totalEngage,
    }
  }
)

export const getSocialPostById = cache(async (id: string, orgId: string) => {
  const social = await prisma.socialPost.findFirst({
    where: { id, organizationId: orgId },
    include: {
      socialAccount: true,
      media: { orderBy: { sortOrder: "asc" } },
      analytics: { orderBy: { date: "desc" } },
    },
  })
  if (social) return social

  const engage = await prisma.engagePost.findFirst({
    where: { id, organizationId: orgId },
    include: {
       user: true
    }
  })
  if (engage) {
    return {
      ...engage,
      contentType: engage.type,
      socialAccount: { provider: "Website", name: "Website" },
      media: [] // EngagePost uses mediaUrls/mediaIds, mapping for UI compatibility
    }
  }
  return null
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
    visibility?: string
    canonicalPath?: string | null
    heroImageId?: string | null
    seoTitle?: string | null
    seoDescription?: string | null
  },
  accountIds: string[]
) {
  const group = randomUUID()
  const defaultContentType = data.contentType || (await prisma.category.findFirst({
    where: { organizationId: orgId, type: "engage" },
    orderBy: { name: "asc" }
  }))?.code || "post"

  // Content-only post (no external social account) — blog / doc / help / changelog.
  if (accountIds.length === 0) {
    const post = await prisma.socialPost.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        socialAccountId: null,
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
        hasComments: false,
        group,
        visibility: data.visibility || "internal",
        canonicalPath: data.canonicalPath ?? null,
        heroImageId: data.heroImageId ?? null,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        media: data.mediaUrls && data.mediaUrls.length > 0 ? {
          create: data.mediaUrls.map((url, index) => ({
            url,
            fileId: data.mediaIds?.[index],
            type: url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image",
            sortOrder: index
          }))
        } : undefined,
      },
    })
    return { group, posts: [post] }
  }

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
    visibility?: string
    canonicalPath?: string | null
    heroImageId?: string | null
    seoTitle?: string | null
    seoDescription?: string | null
  }
) {
  return await prisma.socialPost.update({
    where: { id, organizationId: orgId },
    data,
  })
}

export async function deleteSocialPost(id: string, orgId: string) {
  try {
    return await prisma.socialPost.delete({
      where: { id, organizationId: orgId },
    })
  } catch {
    return await prisma.engagePost.delete({
      where: { id, organizationId: orgId },
    })
  }
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
  const [socialResults, engageResults] = await Promise.all([
    prisma.socialPost.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.engagePost.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
    }),
  ])

  const stats: Record<string, number> = {}
  
  socialResults.forEach(r => {
    stats[r.status] = (stats[r.status] || 0) + r._count
  })
  engageResults.forEach(r => {
    stats[r.status] = (stats[r.status] || 0) + r._count
  })

  return stats
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

export const getEngageSummary = cache(async (orgId: string) => {
  const [socialStats, contentStatsOld, contentStatsNew, accounts] = await Promise.all([
    prisma.socialPost.groupBy({
      by: ["status"],
      where: {
        organizationId: orgId,
        contentType: { in: ["post", "article", "newsletter", "page", "thread", "social"] },
      },
      _count: true,
    }),
    prisma.socialPost.groupBy({
      by: ["status"],
      where: {
        organizationId: orgId,
        contentType: { in: ["blog", "doc", "help", "changelog", "legal", "api-docs", "knowledge"] },
      },
      _count: true,
    }),
    prisma.engagePost.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.socialAccount.findMany({
      where: { organizationId: orgId },
      select: { id: true, provider: true, name: true, picture: true, username: true },
    }),
  ])

  const sumStats = (acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + r._count
    return acc
  }

  const social = socialStats.reduce(sumStats, {} as Record<string, number>)
  const content = [...contentStatsOld, ...contentStatsNew].reduce(sumStats, {} as Record<string, number>)

  return {
    social,
    content,
    accounts,
  }
})

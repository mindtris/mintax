import { prisma } from "@/lib/core/db"
import { cache } from "react"

export const getPostAnalytics = cache(async (postId: string, orgId: string) => {
  const post = await prisma.socialPost.findFirst({
    where: { id: postId, organizationId: orgId },
    select: { id: true },
  })
  if (!post) return []

  return await prisma.socialPostAnalytics.findMany({
    where: { postId },
    orderBy: { date: "desc" },
  })
})

export const getAccountAnalytics = cache(
  async (orgId: string, accountId?: string, dateFrom?: string, dateTo?: string) => {
    const where: any = {
      post: { organizationId: orgId },
    }

    if (accountId) {
      where.post.socialAccountId = accountId
    }

    if (dateFrom || dateTo) {
      where.date = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      }
    }

    const results = await prisma.socialPostAnalytics.aggregate({
      where,
      _sum: {
        impressions: true,
        engagements: true,
        likes: true,
        shares: true,
        comments: true,
        clicks: true,
        reach: true,
      },
      _count: true,
    })

    return {
      impressions: results._sum.impressions || 0,
      engagements: results._sum.engagements || 0,
      likes: results._sum.likes || 0,
      shares: results._sum.shares || 0,
      comments: results._sum.comments || 0,
      clicks: results._sum.clicks || 0,
      reach: results._sum.reach || 0,
      postsTracked: results._count,
    }
  }
)

export async function upsertAnalyticsSnapshot(
  postId: string,
  date: Date,
  data: {
    impressions?: number
    engagements?: number
    likes?: number
    shares?: number
    comments?: number
    clicks?: number
    reach?: number
    extra?: any
  }
) {
  const dateOnly = new Date(date.toISOString().split("T")[0])

  return await prisma.socialPostAnalytics.upsert({
    where: {
      postId_date: { postId, date: dateOnly },
    },
    update: data,
    create: {
      postId,
      date: dateOnly,
      ...data,
    },
  })
}

import config from "@/lib/core/config"
import { getProvider } from "@/lib/integrations/social"
import { upsertAnalyticsSnapshot } from "@/lib/services/social-analytics"
import { prisma } from "@/lib/core/db"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (config.cron.secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${config.cron.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Fetch recently published posts (last 30 days) that have analytics support
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const posts = await prisma.socialPost.findMany({
    where: {
      status: "published",
      publishedAt: { gte: thirtyDaysAgo },
      externalPostId: { not: null },
    },
    include: { socialAccount: true },
    take: 100,
  })

  let updated = 0
  let failed = 0

  for (const post of posts) {
    try {
      if (!post.socialAccount) continue
      const provider = getProvider(post.socialAccount.provider)
      if (!provider.getPostAnalytics || !post.externalPostId) continue

      const analytics = await provider.getPostAnalytics({
        accessToken: post.socialAccount.accessToken,
        externalPostId: post.externalPostId,
      })

      await upsertAnalyticsSnapshot(post.id, new Date(), {
        impressions: analytics.impressions,
        engagements: analytics.engagements,
        likes: analytics.likes,
        shares: analytics.shares,
        comments: analytics.comments,
        clicks: analytics.clicks,
        reach: analytics.reach,
        extra: analytics.extra,
      })

      updated++
    } catch (err) {
      failed++
    }
  }

  return NextResponse.json({ updated, failed, total: posts.length })
}

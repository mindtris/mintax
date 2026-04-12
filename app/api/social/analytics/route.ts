import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { prisma } from "@/lib/core/db"
import { NextRequest, NextResponse } from "next/server"
import { subDays, startOfDay, endOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    
    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "7")
    const startDate = startOfDay(subDays(new Date(), days))

    const analytics = await prisma.socialPostAnalytics.findMany({
      where: {
        post: { organizationId: org.id },
        date: { gte: startDate },
      },
      include: {
        post: {
          select: {
            socialAccount: {
              select: { provider: true }
            }
          }
        }
      },
      orderBy: { date: "asc" },
    })

    // Aggregate by day and provider
    const dailyStats: Record<string, any> = {}
    const providerStats: Record<string, any> = {}

    analytics.forEach((stat) => {
      const day = stat.date.toISOString().split("T")[0]
      if (!dailyStats[day]) {
        dailyStats[day] = { likes: 0, shares: 0, comments: 0, impressions: 0, engagements: 0 }
      }
      dailyStats[day].likes += stat.likes
      dailyStats[day].shares += stat.shares
      dailyStats[day].comments += stat.comments
      dailyStats[day].impressions += stat.impressions
      dailyStats[day].engagements += stat.engagements

      const provider = stat.post.socialAccount.provider
      if (!providerStats[provider]) {
        providerStats[provider] = { likes: 0, shares: 0, comments: 0, count: 0 }
      }
      providerStats[provider].likes += stat.likes
      providerStats[provider].shares += stat.shares
      providerStats[provider].comments += stat.comments
      providerStats[provider].count += 1
    })

    return NextResponse.json({
      daily: Object.entries(dailyStats).map(([date, values]) => ({ date, ...values as any })),
      providers: providerStats,
      summary: {
        totalLikes: analytics.reduce((sum, s) => sum + s.likes, 0),
        totalShares: analytics.reduce((sum, s) => sum + s.shares, 0),
        totalComments: analytics.reduce((sum, s) => sum + s.comments, 0),
        totalImpressions: analytics.reduce((sum, s) => sum + s.impressions, 0),
      }
    })
  } catch (error: any) {
    console.error("Social analytics error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 })
  }
}

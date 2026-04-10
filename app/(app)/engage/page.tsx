import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialPosts, getPostStats } from "@/lib/services/social-posts"
import { PostsViewClient } from "@/components/engage/posts-view"
import { CalendarView } from "@/components/engage/calendar-view"
import { ContentView } from "@/components/engage/content-view"
import { BrandingView } from "@/components/engage/branding-view"
import { AnalyticsView } from "@/components/engage/analytics-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Engage",
}

export default async function EngagePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; status?: string; provider?: string; ordering?: string; month?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "posts"

  switch (activeTab) {
    case "posts": {
      const user = await getCurrentUser()
      const org = await getActiveOrg(user)
      const { search, status, provider, ordering } = params
      const [posts, stats] = await Promise.all([
        getSocialPosts(org.id, { search, status, provider }, { ordering }),
        getPostStats(org.id),
      ])
      return <PostsViewClient posts={posts} total={posts.length} stats={stats} />
    }
    case "calendar":
      return <CalendarView month={params.month} />
    case "content":
      return <ContentView />
    case "branding":
      return <BrandingView />
    case "analytics":
      return <AnalyticsView />
    default: {
      const user = await getCurrentUser()
      const org = await getActiveOrg(user)
      const { search, status, provider, ordering } = params
      const [posts, stats] = await Promise.all([
        getSocialPosts(org.id, { search, status, provider }, { ordering }),
        getPostStats(org.id),
      ])
      return <PostsViewClient posts={posts} total={posts.length} stats={stats} />
    }
  }
}

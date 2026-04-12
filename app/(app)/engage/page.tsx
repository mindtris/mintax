import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialPosts, getPostStats } from "@/lib/services/social-posts"
import { getCategoriesByType } from "@/lib/services/categories"
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
  searchParams: Promise<{ tab?: string; search?: string; status?: string; provider?: string; ordering?: string; month?: string; page?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "posts"
  const currentPage = Math.max(1, parseInt(params.page || "1") || 1)
  const pageSize = 50

  switch (activeTab) {
    case "posts": {
      const user = await getCurrentUser()
      const org = await getActiveOrg(user)
      const { search, status, provider, ordering } = params
      const [results, stats, categories] = await Promise.all([
        getSocialPosts(org.id, { search, status, provider }, { ordering, take: pageSize, skip: (currentPage - 1) * pageSize }),
        getPostStats(org.id),
        getCategoriesByType(org.id, "engage"),
      ])
      return <PostsViewClient posts={results.items} total={results.total} stats={stats} categories={categories} />
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
      const [results, stats, categories] = await Promise.all([
        getSocialPosts(org.id, { search, status, provider }, { ordering, take: pageSize, skip: (currentPage - 1) * pageSize }),
        getPostStats(org.id),
        getCategoriesByType(org.id, "engage"),
      ])
      return <PostsViewClient posts={results.items} total={results.total} stats={stats} categories={categories} />
    }
  }
}

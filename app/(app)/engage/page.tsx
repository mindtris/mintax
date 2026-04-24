import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialPosts, getPostStats, getEngageSummary } from "@/lib/services/social-posts"
import { getCategoriesByType } from "@/lib/services/categories"
import { PostsViewClient } from "@/components/engage/posts-view"
import { CalendarView } from "@/components/engage/calendar-view"
import { BrandingView } from "@/components/engage/branding-view"
import { EngageHubView } from "@/components/engage/hub-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Engage",
}

export default async function EngagePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; status?: string; provider?: string; ordering?: string; month?: string; page?: string; new?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "posts"
  const currentPage = Math.max(1, parseInt(params.page || "1") || 1)
  const pageSize = 50
  
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  // Calendar and Branding remain separate tabs as they are distinct visual tools
  if (activeTab === "calendar") return <CalendarView month={params.month} />
  if (activeTab === "branding") return <BrandingView />

  // default: Posts / Feed (Unified Social + Content)
  const { search, status, provider, ordering } = params
  
  // Fetch ALL posts (no contentType filter implies both social and content)
  const [results, stats, categories] = await Promise.all([
    getSocialPosts(
      org.id, 
      { search, status, provider }, 
      { ordering, take: pageSize, skip: (currentPage - 1) * pageSize }
    ),
    getPostStats(org.id),
    getCategoriesByType(org.id, "engage"),
  ])

  return (
    <PostsViewClient 
      posts={results.items} 
      total={results.total} 
      stats={stats} 
      categories={categories} 
      type="all"
      defaultOpenSheet={params.new === "true"}
    />
  )
}

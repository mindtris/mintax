import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialPosts, getPostStats } from "@/lib/services/social-posts"
import { getCategoriesByType } from "@/lib/services/categories"
import { PostsViewClient } from "@/components/engage/posts-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Social Distribution",
}

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; provider?: string; ordering?: string; page?: string; new?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || "1") || 1)
  const pageSize = 50
  
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  
  const { search, status, provider, ordering } = params
  const [results, stats, categories] = await Promise.all([
    getSocialPosts(
      org.id, 
      { search, status, provider, contentType: "social" }, 
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
      defaultOpenSheet={params.new === "true"}
    />
  )
}

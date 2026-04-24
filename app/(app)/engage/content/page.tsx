import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialPosts, getPostStats } from "@/lib/services/social-posts"
import { getCategoriesByType } from "@/lib/services/categories"
import { PostsViewClient } from "@/components/engage/posts-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Website Content",
}

const CONTENT_TYPES = ["blog", "doc", "help", "changelog"]

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; category?: string; ordering?: string; page?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || "1") || 1)
  const pageSize = 50
  
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  
  const { search, status, category, ordering } = params
  
  // We need to fetch each content type or modify getSocialPosts to support multiple content types at once.
  // Currently getSocialPosts.contentType is a string.
  // I'll modify getSocialPosts later to support an array if needed, but for now I'll just filter manually or fetch each.
  // Actually, I can just fetch all and filter in memory if it's small, OR just use a loop.
  // Better yet, I'll update getSocialPosts to support { in: [...] } for contentType.
  
  const [results, stats, categories] = await Promise.all([
    getSocialPosts(
      org.id, 
      { search, status, category, contentType: "content" }, 
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
      type="content"
    />
  )
}

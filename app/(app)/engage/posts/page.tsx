import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewPostSheet } from "@/components/engage/new-post-sheet"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialPosts, getPostStats, SocialPostFilters } from "@/lib/services/social-posts"
import { formatDate } from "date-fns"
import { PenTool, Plus } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Posts",
  description: "Manage your social media posts",
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  queued: "secondary",
  publishing: "secondary",
  published: "default",
  error: "destructive",
}

export default async function PostsPage({ searchParams }: { searchParams: Promise<SocialPostFilters & { page?: string }> }) {
  const filters = await searchParams
  const currentPage = Math.max(1, parseInt(filters.page || "1") || 1)
  const pageSize = 50
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { items: posts, total: totalCount } = await getSocialPosts(org.id, filters, { take: pageSize, skip: (currentPage - 1) * pageSize })
  const stats = await getPostStats(org.id)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <span className="text-2xl tracking-tight text-muted-foreground">{totalCount}</span>
        </div>
        <NewPostSheet>
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden md:block">Create Post</span>
          </Button>
        </NewPostSheet>
      </header>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(stats).map(([status, count]) => (
          <Badge key={status} variant="outline" className="capitalize px-3 py-1">
            {status}: {count}
          </Badge>
        ))}
      </div>

      {/* Post List */}
      {posts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/engage/posts/${post.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusVariant[post.status] || "outline"} className="capitalize text-xs">
                        {post.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-xs">
                        {post.socialAccount.provider}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {post.contentType}
                      </Badge>
                    </div>
                    {post.title && <div className="font-medium truncate">{post.title}</div>}
                    <div className="text-sm text-muted-foreground truncate">{post.content.slice(0, 120)}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    {post.publishedAt && <div>Published {formatDate(new Date(post.publishedAt), "MMM dd")}</div>}
                    {post.scheduledAt && !post.publishedAt && (
                      <div>Scheduled {formatDate(new Date(post.scheduledAt), "MMM dd, HH:mm")}</div>
                    )}
                    {!post.scheduledAt && !post.publishedAt && (
                      <div>Created {formatDate(new Date(post.createdAt), "MMM dd")}</div>
                    )}
                    <div className="text-xs mt-1">@{post.socialAccount.username || post.socialAccount.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <PenTool className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">No posts yet</h3>
              <p className="text-muted-foreground mt-1">
                Create your first post to publish across your connected platforms.
              </p>
            </div>
            <NewPostSheet>
              <Button>
                <Plus className="h-4 w-4" />
                Create Post
              </Button>
            </NewPostSheet>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewPostSheet } from "@/components/engage/new-post-sheet"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialAccountCount } from "@/lib/services/social-accounts"
import { getPostCountThisWeek, getPostStats, getRecentPublished, getUpcomingPosts } from "@/lib/services/social-posts"
import { formatDate } from "date-fns"
import { Calendar, CheckCircle, PenTool, Plus, Share2 } from "lucide-react"
import Link from "next/link"

export async function EngageWidget() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const accountCount = await getSocialAccountCount(org.id)
  const postsThisWeek = await getPostCountThisWeek(org.id)
  const stats = await getPostStats(org.id)
  const upcoming = await getUpcomingPosts(org.id, 5)
  const recent = await getRecentPublished(org.id, 5)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Engage</h2>
          <p className="text-sm text-muted-foreground">Social media and content management</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/engage/social">
            <Button variant="outline" size="sm">
              <Share2 className="h-3.5 w-3.5" />
              Accounts
            </Button>
          </Link>
          <NewPostSheet>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Create Post
            </Button>
          </NewPostSheet>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>
            <div className="text-2xl font-bold mt-1">{accountCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <div className="text-2xl font-bold mt-1">{postsThisWeek}</div>
          </CardContent>
        </Card>
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Scheduled</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.queued || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Published</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.published || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming + Recent */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Link href="/engage/posts?status=queued" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((post) => (
                  <Link key={post.id} href={`/engage/posts/${post.id}`} className="flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-sm truncate">{post.content.slice(0, 60)}</div>
                      <div className="text-xs text-muted-foreground capitalize">{post.socialAccount.provider}</div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {post.scheduledAt && formatDate(new Date(post.scheduledAt), "MMM dd, HH:mm")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming posts scheduled</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent</CardTitle>
              <Link href="/engage/posts?status=published" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recent.length > 0 ? (
              <div className="space-y-3">
                {recent.map((post) => (
                  <Link key={post.id} href={`/engage/posts/${post.id}`} className="flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-sm truncate">{post.content.slice(0, 60)}</div>
                      <div className="text-xs text-muted-foreground capitalize">{post.socialAccount.provider}</div>
                    </div>
                    {post.externalUrl ? (
                      <Badge variant="outline" className="text-xs shrink-0">Published</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {post.publishedAt && formatDate(new Date(post.publishedAt), "MMM dd")}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No published posts yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

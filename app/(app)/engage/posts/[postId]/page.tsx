import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialPostById } from "@/lib/services/social-posts"
import { getPostAnalytics } from "@/lib/services/social-analytics"
import { formatDate } from "date-fns"
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DeletePostButton } from "./client"

export const metadata: Metadata = { title: "Post Detail" }

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  queued: "secondary",
  publishing: "secondary",
  published: "default",
  error: "destructive",
}

export default async function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const post = await getSocialPostById(postId, org.id)

  if (!post) notFound()

  const analytics = await getPostAnalytics(postId, org.id)

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/engage/posts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Post Detail</h1>
      </div>

      {/* Status + Meta */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[post.status] || "outline"} className="capitalize">
                {post.status}
              </Badge>
              <Badge variant="outline" className="capitalize">{post.socialAccount.provider}</Badge>
              <Badge variant="outline">{post.contentType}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {post.externalUrl && (
                <a href={post.externalUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View on {post.socialAccount.provider}
                  </Button>
                </a>
              )}
              {post.status === "draft" && (
                <DeletePostButton postId={post.id} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {post.socialAccount.picture && (
              <img src={post.socialAccount.picture} alt="" className="h-10 w-10 rounded-full" />
            )}
            <div>
              <div className="font-medium">{post.socialAccount.name}</div>
              <div className="text-sm text-muted-foreground">
                @{post.socialAccount.username || post.socialAccount.name}
              </div>
            </div>
          </div>

          {post.title && <h2 className="text-xl font-semibold">{post.title}</h2>}
          {post.excerpt && <p className="text-muted-foreground">{post.excerpt}</p>}

          <div className="whitespace-pre-wrap text-sm leading-relaxed border rounded-md p-4 bg-background">
            {post.content}
          </div>

          {post.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
              ))}
            </div>
          )}

          {/* Media */}
          {post.media.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.media.map((m) => (
                <div key={m.id} className="border rounded-md overflow-hidden">
                  {m.type === "image" && m.url && (
                    <img src={m.url} alt={m.alt || ""} className="w-full h-40 object-cover" />
                  )}
                  {m.type === "video" && m.url && (
                    <video src={m.url} controls className="w-full h-40 object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div>
              <span className="font-medium text-foreground">Created:</span>{" "}
              {formatDate(new Date(post.createdAt), "MMM dd, yyyy HH:mm")}
            </div>
            {post.scheduledAt && (
              <div>
                <span className="font-medium text-foreground">Scheduled:</span>{" "}
                {formatDate(new Date(post.scheduledAt), "MMM dd, yyyy HH:mm")}
              </div>
            )}
            {post.publishedAt && (
              <div>
                <span className="font-medium text-foreground">Published:</span>{" "}
                {formatDate(new Date(post.publishedAt), "MMM dd, yyyy HH:mm")}
              </div>
            )}
            {post.error && (
              <div className="col-span-2">
                <span className="font-medium text-destructive">Error:</span>{" "}
                <span className="text-destructive">{post.error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      {analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {(() => {
                const totals = analytics.reduce(
                  (acc, a) => ({
                    impressions: acc.impressions + a.impressions,
                    likes: acc.likes + a.likes,
                    shares: acc.shares + a.shares,
                    comments: acc.comments + a.comments,
                  }),
                  { impressions: 0, likes: 0, shares: 0, comments: 0 }
                )
                return (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totals.impressions}</div>
                      <div className="text-xs text-muted-foreground">Impressions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totals.likes}</div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totals.shares}</div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totals.comments}</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewPostSheet } from "@/components/engage/new-post-sheet"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSocialAccountCount } from "@/lib/services/social-accounts"
import { getPostCountThisWeek, getPostStats, getRecentPublished, getUpcomingPosts } from "@/lib/services/social-posts"
import { getAccountAnalytics } from "@/lib/services/social-analytics"
import { formatDate } from "date-fns"
import { Calendar, CheckCircle, PenTool, Plus, Share2, Eye, BarChart3, Heart, MessageCircle, MousePointerClick, Users } from "lucide-react"
import Link from "next/link"
import { SocialAnalyticsChart } from "@/components/engage/social-analytics-chart"

export async function EngageWidget() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const [accountCount, postsThisWeek, stats, upcoming, recent, totals] = await Promise.all([
    getSocialAccountCount(org.id),
    getPostCountThisWeek(org.id),
    getPostStats(org.id),
    getUpcomingPosts(org.id, 5),
    getRecentPublished(org.id, 5),
    getAccountAnalytics(org.id)
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Engage Analytics</h2>
          <p className="text-sm text-muted-foreground">Performance and social management</p>
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

      {/* Main Analytics Row */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <MetricCard icon={Eye} label="Impressions" value={totals.impressions} />
        <MetricCard icon={BarChart3} label="Engagements" value={totals.engagements} />
        <MetricCard icon={Heart} label="Likes" value={totals.likes} />
        <MetricCard icon={Share2} label="Shares" value={totals.shares} />
        <MetricCard icon={MessageCircle} label="Comments" value={totals.comments} />
        <MetricCard icon={MousePointerClick} label="Clicks" value={totals.clicks} />
        <MetricCard icon={Users} label="Reach" value={totals.reach} />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <SocialAnalyticsChart />
        </div>
        
        {/* Status Mini-Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <StatsCard label="This Week" value={postsThisWeek} icon={PenTool} />
            <StatsCard label="Scheduled" value={stats.queued || 0} icon={Calendar} />
            <StatsCard label="Published" value={stats.published || 0} icon={CheckCircle} />
            <StatsCard label="Accounts" value={accountCount} icon={Share2} />
        </div>
      </div>

      {/* Upcoming + Recent */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Upcoming Schedule</CardTitle>
              <Link href="/engage/posts?status=queued" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((post) => (
                  <Link key={post.id} href={`/engage/posts/${post.id}`} className="flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-sm truncate">{post.content.slice(0, 60)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{post.socialAccount?.provider ?? post.contentType}</div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">
                      {post.scheduledAt && formatDate(new Date(post.scheduledAt), "MMM dd, HH:mm")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center italic">No upcoming posts scheduled</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Link href="/engage/posts?status=published" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {recent.length > 0 ? (
              <div className="space-y-3">
                {recent.map((post) => (
                  <Link key={post.id} href={`/engage/posts/${post.id}`} className="flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-sm truncate">{post.content.slice(0, 60)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{post.socialAccount?.provider ?? post.contentType}</div>
                    </div>
                    {post.externalUrl ? (
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0 px-1.5 shrink-0">Live</Badge>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">
                        {post.publishedAt && formatDate(new Date(post.publishedAt), "MMM dd")}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center italic">No published posts yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
      <CardContent className="pt-6 px-4 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="text-xl font-bold tracking-tight">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}

function StatsCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
    return (
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between hover:border-input transition-colors group">
            <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
                <div className="text-xl font-bold tracking-tight tabular-nums">{value}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
        </div>
    )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getAccountAnalytics } from "@/lib/services/social-analytics"
import { getSocialAccounts } from "@/lib/services/social-accounts"
import { getPostStats, getRecentPublished } from "@/lib/services/social-posts"
import { BarChart3, Eye, Heart, MessageCircle, MousePointerClick, Share2, Users } from "lucide-react"
import { formatDate } from "date-fns"

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-[#141413]" />
          <span className="text-sm font-medium text-[#141413]">{label}</span>
        </div>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}

export async function AnalyticsView() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const accounts = await getSocialAccounts(org.id)
  const stats = await getPostStats(org.id)
  const totals = await getAccountAnalytics(org.id)
  const recentPosts = await getRecentPublished(org.id, 10)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Analytics</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <MetricCard icon={Eye} label="Impressions" value={totals.impressions} />
        <MetricCard icon={BarChart3} label="Engagements" value={totals.engagements} />
        <MetricCard icon={Heart} label="Likes" value={totals.likes} />
        <MetricCard icon={Share2} label="Shares" value={totals.shares} />
        <MetricCard icon={MessageCircle} label="Comments" value={totals.comments} />
        <MetricCard icon={MousePointerClick} label="Clicks" value={totals.clicks} />
        <MetricCard icon={Users} label="Reach" value={totals.reach} />
      </div>

      <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-black/[0.03]">
          <CardTitle className="text-sm font-medium">By account</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {accounts.length > 0 ? (
            <div className="divide-y divide-black/[0.03]">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {account.picture && (
                      <img src={account.picture} alt="" className="h-8 w-8 rounded-full" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{account.name}</div>
                      <div className="text-xs text-[#141413] capitalize">{account.provider}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {account.disabled ? "Disabled" : "Active"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No accounts connected yet</p>
          )}
        </CardContent>
      </Card>

      {recentPosts.length > 0 && (
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-black/[0.03]">
            <CardTitle className="text-sm font-medium">Recent published</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="divide-y divide-black/[0.03]">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="text-sm truncate">{post.title || post.content.slice(0, 80)}</div>
                    <div className="text-xs text-[#141413] capitalize">
                      {post.socialAccount.provider} · {post.publishedAt && formatDate(new Date(post.publishedAt), "MMM dd")}
                    </div>
                  </div>
                  {post.externalUrl && (
                    <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Share2, FileText, Plus, ArrowRight, Share, Clock, Newspaper, AlertCircle, Settings } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function EngageHubView({ summary }: { summary: any }) {
  const socialTotal = Object.values(summary.social as Record<string, number>).reduce((a, b) => a + b, 0)
  const contentTotal = Object.values(summary.content as Record<string, number>).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-8 pb-10">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Engage</h1>
          <p className="text-sm text-muted-foreground">Manage your social distribution and website content.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="font-bold uppercase tracking-tight h-9">
                <Link href="/settings/categories?type=engage">
                    <Settings className="h-3.5 w-3.5 mr-2" />
                    Setup content
                </Link>
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Distribution Hub */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold tracking-tight font-display">Social distribution</h2>
            </div>
            <Link href="/engage?tab=social" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 uppercase tracking-wider">
              Feed <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="border-border/50 shadow-sm overflow-hidden group">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border/40 bg-muted/5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tighter font-display tabular-nums">{socialTotal}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Total Posts</span>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y border-t border-border/10">
                <StatusItem label="Published" value={summary.social.published || 0} icon={Share} color="text-green-600" />
                <StatusItem label="Queued" value={summary.social.queued || 0} icon={Clock} color="text-indigo-600" />
                <StatusItem label="Drafts" value={summary.social.draft || 0} icon={Newspaper} color="text-blue-600" />
                <StatusItem label="Failed" value={summary.social.error || 0} icon={AlertCircle} color="text-red-600" />
              </div>
              <div className="p-4 bg-muted/20">
                 <Button asChild className="w-full font-bold uppercase tracking-tight shadow-md">
                    <Link href="/engage/posts/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Social Post
                    </Link>
                 </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Connected Accounts Quick View */}
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Channels Connected</div>
            <div className="flex flex-wrap gap-2">
              {summary.accounts.length > 0 ? (
                summary.accounts.map((acc: any) => (
                  <Badge key={acc.id} variant="secondary" className="px-2 py-1 rounded-md flex items-center gap-2 border-border/50">
                    {acc.picture ? <img src={acc.picture} className="w-3.5 h-3.5 rounded-full" /> : <Share2 className="w-3 h-3" />}
                    <span className="text-[10px] font-bold">{acc.name}</span>
                  </Badge>
                ))
              ) : (
                <div className="w-full rounded-xl border border-dashed border-border/60 p-4 flex flex-col items-center gap-2 text-center bg-muted/5">
                   <p className="text-xs text-muted-foreground font-medium">No social channels connected yet.</p>
                   <Button asChild variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tight">
                      <Link href="/settings/accounts">Connect</Link>
                   </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Website Content Hub */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold tracking-tight font-display">Website content</h2>
            </div>
            <Link href="/engage?tab=content" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 uppercase tracking-wider">
              Library <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border/40 bg-muted/5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tighter font-display tabular-nums">{contentTotal}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Total Content</span>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y border-t border-border/10">
                <StatusItem label="Live" value={summary.content.published || 0} icon={Share} color="text-green-600" />
                <StatusItem label="Scheduled" value={summary.content.queued || 0} icon={Clock} color="text-indigo-600" />
                <StatusItem label="In Progress" value={summary.content.draft || 0} icon={Newspaper} color="text-blue-600" />
                <StatusItem label="Errors" value={summary.content.error || 0} icon={AlertCircle} color="text-red-600" />
              </div>
              <div className="p-4 bg-muted/20">
                 <Button asChild variant="secondary" className="w-full font-bold uppercase tracking-tight shadow-sm">
                    <Link href="/engage/content/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Draft Article
                    </Link>
                 </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-5 rounded-2xl border border-border/50 bg-card/50 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-tight">Public API</div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Integrate content with your frontend</div>
            </div>
            <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
               <Link href="/settings/api">
                  <ArrowRight className="h-4 w-4" />
               </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusItem({ label, value, icon: Icon, color }: any) {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3 w-3", color)} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  )
}

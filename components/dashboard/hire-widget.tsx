import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getJobAnalytics, getJobPostings } from "@/lib/services/jobs"
import { BriefcaseBusiness, Plus, UserCheck, Users, UserSearch } from "lucide-react"
import Link from "next/link"

const CARD = "border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden"

export async function HireWidget() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const analytics = await getJobAnalytics(org.id)
  const jobs = await getJobPostings(org.id)
  const openJobs = jobs.filter((j: any) => j.status === "open").slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Hire</h2>
          <p className="text-sm text-muted-foreground">Jobs, applicants, and recruitment pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/hire">
            <Button variant="outline" size="sm">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              All jobs
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Open jobs</span>
            </div>
            <div className="text-2xl font-bold mt-1">{analytics.open}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Applicants</span>
            </div>
            <div className="text-2xl font-bold mt-1">{analytics.totalApplicants}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserSearch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Positions</span>
            </div>
            <div className="text-2xl font-bold mt-1">{analytics.total}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Drafts</span>
            </div>
            <div className="text-2xl font-bold mt-1">{analytics.draft}</div>
          </CardContent>
        </Card>
      </div>

      <Card className={CARD}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Open positions</CardTitle>
            <Link href="/hire" className="text-xs text-primary hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardContent>
          {openJobs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No open positions. Post your first job to start.</p>
              <Link href="/hire">
                <Button size="sm" className="mt-3">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Post job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {openJobs.map((job: any) => (
                <Link key={job.id} href={`/hire/${job.id}/applicants`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.category?.name || "Uncategorized"} · {job._count.applicants} applicants</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

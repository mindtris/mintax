import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getJobPostings } from "@/lib/services/jobs"
import { getCandidatePipeline } from "@/lib/services/candidates"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, Users, Briefcase, TrendingUp, XCircle } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Pipeline overview | Hire",
}

export default async function PipelineOverviewPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const jobs = await getJobPostings(org.id)

  // Aggregate pipeline stats across all jobs
  let totalNew = 0, totalScreening = 0, totalInterview = 0, totalOffered = 0, totalHired = 0, totalRejected = 0

  const jobPipelines = await Promise.all(
    jobs.filter((j: any) => j.status === "open").map(async (job: any) => {
      const pipeline = await getCandidatePipeline(job.id)
      totalNew += pipeline.new.length
      totalScreening += pipeline.screening.length
      totalInterview += pipeline.interview.length
      totalOffered += pipeline.offered.length
      totalHired += pipeline.hired.length
      totalRejected += pipeline.rejected.length
      return { job, pipeline }
    })
  )

  const stages = [
    { name: "New", count: totalNew, icon: Clock, color: "text-blue-500 bg-blue-500/10" },
    { name: "Screening", count: totalScreening, icon: TrendingUp, color: "text-purple-500 bg-purple-500/10" },
    { name: "Interview", count: totalInterview, icon: Users, color: "text-pink-500 bg-pink-500/10" },
    { name: "Offered", count: totalOffered, icon: Briefcase, color: "text-orange-500 bg-orange-500/10" },
    { name: "Hired", count: totalHired, icon: CheckCircle2, color: "text-green-500 bg-green-500/10" },
    { name: "Rejected", count: totalRejected, icon: XCircle, color: "text-red-500 bg-red-500/10" },
  ]

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline overview</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Aggregate view across all open positions.</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const Icon = stage.icon
          return (
            <Card key={stage.name}>
              <CardContent className="pt-6 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stage.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold">{stage.count}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stage.name}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Per-job breakdown */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">By position</h2>
        {jobPipelines.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No open positions.</p>
        ) : (
          jobPipelines.map(({ job, pipeline }: any) => (
            <Link key={job.id} href={`/hire/${job.id}/applicants`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.category?.name || "Uncategorized"} · {job.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{pipeline.new.length} new</Badge>
                    <Badge variant="secondary" className="text-xs">{pipeline.screening.length + pipeline.interview.length} in progress</Badge>
                    <Badge className="bg-green-100 text-green-700 text-xs">{pipeline.hired.length} hired</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

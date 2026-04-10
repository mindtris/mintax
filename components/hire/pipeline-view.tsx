import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCandidatePipeline } from "@/lib/services/candidates"
import { getJobPostings } from "@/lib/services/jobs"
import { PipelineViewClient } from "./pipeline-view-client"

export async function PipelineView() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const jobs = await getJobPostings(org.id, { status: "open" })

  // Aggregate pipeline across all open jobs
  const aggregated: Record<string, any[]> = {
    new: [],
    screening: [],
    interview: [],
    offered: [],
    hired: [],
  }

  for (const job of jobs) {
    const pipeline = await getCandidatePipeline(job.id)
    for (const stage of Object.keys(aggregated)) {
      if (pipeline[stage]) {
        aggregated[stage].push(
          ...pipeline[stage].map((c: any) => ({ ...c, jobTitle: job.title }))
        )
      }
    }
  }

  const stages = [
    { id: "new", name: "New", color: "text-blue-500 bg-blue-500/10" },
    { id: "screening", name: "Screening", color: "text-purple-500 bg-purple-500/10" },
    { id: "interview", name: "Interview", color: "text-pink-500 bg-pink-500/10" },
    { id: "offered", name: "Offered", color: "text-orange-500 bg-orange-500/10" },
    { id: "hired", name: "Hired", color: "text-green-500 bg-green-500/10" },
  ]

  return <PipelineViewClient initialData={aggregated} stages={stages} />
}

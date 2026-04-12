import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCandidatePipeline } from "@/lib/services/candidates"
import { getJobPostings } from "@/lib/services/jobs"
import { PipelineViewClient } from "./pipeline-view-client"
import { prisma } from "@/lib/core/db"
import { Briefcase } from "lucide-react"

export async function PipelineView() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const jobs = await getJobPostings(org.id, { status: "open" })

  const categories = await prisma.category.findMany({
    where: { organizationId: org.id, type: "applicant_status" },
    orderBy: { name: "asc" }
  })

  // Aggregate pipeline across all open jobs
  const aggregated: Record<string, any[]> = {}
  categories.forEach(c => {
    const code = (c.code as string) || "unprocessed"
    aggregated[code] = []
  })

  for (const job of jobs) {
    const pipeline = await getCandidatePipeline(org.id, job.id)
    for (const stage of Object.keys(aggregated)) {
      if ((pipeline as any)[stage]) {
        (aggregated as any)[stage].push(
          ...(pipeline as any)[stage].map((c: any) => ({ ...c, jobTitle: job.title }))
        )
      }
    }
  }

  const stages = categories.map(cat => ({
    id: (cat.code as string) || "unprocessed",
    name: cat.name,
    color: cat.color || "#c96442"
  }))

  return <PipelineViewClient initialData={aggregated} stages={stages} />
}

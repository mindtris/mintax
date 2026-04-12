import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { prisma } from "@/lib/core/db"
import { getJobPosting } from "@/lib/services/jobs"
import { getCandidatePipeline, getCandidates } from "@/lib/services/candidates"
import { AddApplicantSheet } from "@/components/hire/add-applicant-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ChevronLeft,
  Clock,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Plus,
  ExternalLink,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { KanbanBoard } from "@/components/hire/pipeline/kanban-board"

export const metadata = {
  title: "Applicant pipeline | Hire",
}

export default async function PipelinePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const job = await getJobPosting(jobId)
  if (!job) notFound()

  const [pipeline, candidates, categories] = await Promise.all([
    getCandidatePipeline(org.id, jobId),
    getCandidates(org.id, { group: "ATS" }),
    prisma.category.findMany({
      where: { organizationId: org.id, type: "applicant_status" },
      orderBy: { name: "asc" }
    })
  ])

  const stageIcons: Record<string, any> = {
    unprocessed: Clock,
    screening: TrendingUp,
    interview_internal: Users,
    interview_client: Users,
    offered: Briefcase,
    hired: CheckCircle2,
    rejected: XCircle,
  }

  const stages = categories.map(cat => {
    const code = (cat.code as string) || "unprocessed"
    return {
      id: code,
      name: cat.name,
      icon: stageIcons[code] || Briefcase,
      count: (pipeline[code] || []).length,
      color: cat.color || "#c96442"
    }
  })

  return (
    <div className="flex flex-col gap-8 pb-12 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hire">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest">{job.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Pipeline management · {job._count.candidates} applicants
            </p>
          </div>
        </div>
        <AddApplicantSheet jobId={jobId} candidates={candidates}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add applicant
          </Button>
        </AddApplicantSheet>
      </div>

      <KanbanBoard initialData={pipeline} stages={stages} />
    </div>
  )
}

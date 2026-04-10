import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getJobPostings, getJobAnalytics } from "@/lib/services/jobs"
import { getCategoriesByType } from "@/lib/services/categories"
import { getCandidates } from "@/lib/services/candidates"
import { JobsViewClient } from "@/components/hire/jobs-view"
import { CandidatesViewClient } from "@/components/hire/candidates-view"
import { PipelineView } from "@/components/hire/pipeline-view"
import { ScreeningView } from "@/components/hire/screening-view"
import { OffersView } from "@/components/hire/offers-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hire",
}

export default async function HirePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; search?: string; status?: string; ordering?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const activeTab = params.tab || "jobs"
  const search = params.search || params.q
  const { status, ordering } = params

  switch (activeTab) {
    case "jobs": {
      const [jobs, analytics, categories] = await Promise.all([
        getJobPostings(org.id, { search, status }, { ordering }),
        getJobAnalytics(org.id),
        getCategoriesByType(org.id, "hire"),
      ])
      return (
        <JobsViewClient
          jobs={jobs}
          total={jobs.length}
          analytics={analytics}
          categories={categories}
          currency={org.baseCurrency}
          orgSlug={org.slug}
        />
      )
    }
    case "candidates": {
      const candidates = await getCandidates(org.id, { group: "ATS", search, status }, { ordering })
      return <CandidatesViewClient candidates={candidates} total={candidates.length} tab="candidates" />
    }
    case "bench": {
      const bench = await getCandidates(org.id, { group: "BENCH", search, status }, { ordering })
      return <CandidatesViewClient candidates={bench} total={bench.length} tab="bench" />
    }
    case "pipeline":
      return <PipelineView />
    case "screening":
      return <ScreeningView searchParams={params} />
    case "offers":
      return <OffersView searchParams={params} />
    default: {
      const [jobs, analytics, categories] = await Promise.all([
        getJobPostings(org.id, { search, status }, { ordering }),
        getJobAnalytics(org.id),
        getCategoriesByType(org.id, "hire"),
      ])
      return (
        <JobsViewClient
          jobs={jobs}
          total={jobs.length}
          analytics={analytics}
          categories={categories}
          currency={org.baseCurrency}
          orgSlug={org.slug}
        />
      )
    }
  }
}

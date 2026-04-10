import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCandidates } from "@/lib/services/candidates"
import { CandidatesViewClient } from "./candidates-view"

export async function ScreeningView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { search, ordering } = searchParams

  const candidates = await getCandidates(org.id, { group: "ATS", search, status: "screening" }, { ordering })

  return <CandidatesViewClient candidates={candidates} total={candidates.length} tab="screening" />
}

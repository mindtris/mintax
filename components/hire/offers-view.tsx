import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCandidates } from "@/lib/services/candidates"
import { CandidatesViewClient } from "./candidates-view"

export async function OffersView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { search, ordering } = searchParams

  const candidates = await getCandidates(org.id, { group: "ATS", search, status: "offered" }, { ordering })

  return <CandidatesViewClient candidates={candidates} total={candidates.length} tab="offers" />
}

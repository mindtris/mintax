import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getLeads, getLeadStats } from "@/lib/services/leads"
import { LeadsViewClient } from "./leads-view-client"

export async function LeadsView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { search, stage, source, ordering } = searchParams

  const [leads, stats] = await Promise.all([
    getLeads(org.id, { search, stage, source }, { ordering }),
    getLeadStats(org.id),
  ])

  return (
    <LeadsViewClient
      leads={leads}
      total={leads.length}
      stats={stats}
      currency={org.baseCurrency}
    />
  )
}

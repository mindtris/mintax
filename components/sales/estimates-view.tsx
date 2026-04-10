import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getInvoices, getInvoiceStats } from "@/lib/services/invoices"
import { EstimatesViewClient } from "./estimates-view-client"

export async function EstimatesView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { q, status, ordering } = searchParams

  const [estimates, stats] = await Promise.all([
    getInvoices(org.id, { type: "estimate", search: q, status }, { ordering }),
    getInvoiceStats(org.id, "estimate"),
  ])

  return (
    <EstimatesViewClient
      estimates={estimates}
      total={estimates.length}
      stats={stats}
    />
  )
}

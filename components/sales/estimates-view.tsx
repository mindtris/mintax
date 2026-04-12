import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getInvoices, getInvoiceStats } from "@/lib/services/invoices"
import { EstimatesViewClient } from "./estimates-view-client"

export async function EstimatesView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { q, status, ordering, page } = searchParams
  const currentPage = Math.max(1, parseInt(page) || 1)
  const pageSize = 50

  const [estimatesResult, stats] = await Promise.all([
    getInvoices(org.id, { type: "estimate", search: q, status }, { ordering, take: pageSize, skip: (currentPage - 1) * pageSize }),
    getInvoiceStats(org.id, "estimate"),
  ])

  return (
    <EstimatesViewClient
      estimates={estimatesResult.items}
      total={estimatesResult.total}
      stats={stats}
    />
  )
}

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getInvoices, getInvoiceStats } from "@/lib/services/invoices"
import { InvoicesViewClient } from "./invoices-view-client"

export async function InvoicesView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { q, status, ordering } = searchParams

  const [invoices, stats] = await Promise.all([
    getInvoices(org.id, { type: "sales", search: q, status }, { ordering }),
    getInvoiceStats(org.id, "sales"),
  ])

  return (
    <InvoicesViewClient
      invoices={invoices}
      total={invoices.length}
      stats={stats}
    />
  )
}

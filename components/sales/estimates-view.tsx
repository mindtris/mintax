import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getInvoices, getInvoiceStats } from "@/lib/services/invoices"
import { getItems } from "@/lib/services/items"
import { getTaxes } from "@/lib/services/taxes"
import { getCurrencies } from "@/lib/services/currencies"
import { getSettings } from "@/lib/services/settings"
import { EstimatesViewClient } from "./estimates-view-client"

export async function EstimatesView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { q, status, ordering, page } = searchParams
  const currentPage = Math.max(1, parseInt(page) || 1)
  const pageSize = 50

  const [estimatesResult, stats, items, taxes, currencies, settings] = await Promise.all([
    getInvoices(org.id, { type: "estimate", search: q, status }, { ordering, take: pageSize, skip: (currentPage - 1) * pageSize }),
    getInvoiceStats(org.id, "estimate"),
    getItems(org.id),
    getTaxes(org.id),
    getCurrencies(org.id),
    getSettings(org.id),
  ])

  return (
    <EstimatesViewClient
      estimates={estimatesResult.items}
      total={estimatesResult.total}
      stats={stats}
      baseCurrency={org.baseCurrency}
      taxId={org.taxId || ""}
      invoiceSettings={settings}
      currencies={currencies.map((c) => ({ code: c.code, name: c.name }))}
      items={items.map((i) => ({ id: i.id, name: i.name, salePrice: i.salePrice || 0 }))}
      taxes={taxes.map((t) => ({ id: t.id, name: t.name, rate: t.rate, type: t.type }))}
    />
  )
}

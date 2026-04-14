import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getInvoices, getInvoiceStats } from "@/lib/services/invoices"
import { getItems } from "@/lib/services/items"
import { getTaxes } from "@/lib/services/taxes"
import { getCurrencies } from "@/lib/services/currencies"
import { getSettings } from "@/lib/services/settings"
import { InvoicesViewClient } from "./invoices-view-client"

export async function InvoicesView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { q, status, ordering, page } = searchParams
  const currentPage = Math.max(1, parseInt(page) || 1)
  const pageSize = 50

  const [invoicesResult, stats, items, taxes, currencies, settings] = await Promise.all([
    getInvoices(org.id, { type: "sales", search: q, status }, { ordering, take: pageSize, skip: (currentPage - 1) * pageSize }),
    getInvoiceStats(org.id, "sales"),
    getItems(org.id),
    getTaxes(org.id),
    getCurrencies(org.id),
    getSettings(org.id),
  ])

  return (
    <InvoicesViewClient
      invoices={invoicesResult.items}
      total={invoicesResult.total}
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

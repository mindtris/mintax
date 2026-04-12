import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getAppData } from "@/lib/services/apps"
import { getCurrencies } from "@/lib/services/currencies"
import { getInvoices } from "@/lib/services/invoices"
import { getSettings } from "@/lib/services/settings"
import { InvoiceGenerator } from "./components/invoice-generator"
import { InvoiceTemplate } from "./default-templates"
import { manifest } from "./manifest"

export type InvoiceAppData = {
  templates: InvoiceTemplate[]
}

export default async function InvoicesApp() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const settings = await getSettings(org.id)
  const currencies = await getCurrencies(org.id)
  const appData = (await getAppData(org.id, "invoices")) as InvoiceAppData | null

  // Load saved invoices for PDF preview/export
  const { items: invoices } = await getInvoices(org.id, { type: "sales" }, { ordering: "desc", take: 100 })

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.name}
          </span>
        </h2>
      </header>
      <InvoiceGenerator
        user={user}
        org={org}
        settings={settings}
        currencies={currencies}
        appData={appData}
        savedInvoices={invoices.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          clientEmail: inv.clientEmail,
          clientAddress: inv.clientAddress,
          clientTaxId: inv.clientTaxId,
          total: inv.total,
          subtotal: inv.subtotal,
          taxTotal: inv.taxTotal,
          currency: inv.currency,
          status: inv.status,
          issuedAt: inv.issuedAt?.toISOString?.() || inv.issuedAt,
          dueAt: inv.dueAt?.toISOString?.() || inv.dueAt,
          notes: inv.notes,
          items: inv.items || [],
        }))}
      />
    </div>
  )
}

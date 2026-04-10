import { InvoicesView } from "@/components/sales/invoices-view"
import { EstimatesView } from "@/components/sales/estimates-view"
import { ContactsView } from "@/components/sales/contacts-view"
import { LeadsView } from "@/components/sales/leads-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sales",
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; search?: string; status?: string; stage?: string; source?: string; ordering?: string; country?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "leads"

  const renderView = () => {
    switch (activeTab) {
      case "leads":
        return <LeadsView searchParams={params} />
      case "invoices":
        return <InvoicesView searchParams={params} />
      case "estimates":
        return <EstimatesView searchParams={params} />
      case "contacts":
        return <ContactsView searchParams={params} />
      default:
        return <LeadsView searchParams={params} />
    }
  }

  return renderView()
}

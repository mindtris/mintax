import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { listContacts, getDistinctCountries, type ContactFilters } from "@/lib/services/contacts"
import { getCurrencies } from "@/lib/services/currencies"
import { getCategoriesByType } from "@/lib/services/categories"
import { CustomersView } from "@/components/contacts/customers-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Customer Hub",
  description: "Manage your clients, vendors, contractors, providers, and partners.",
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; country?: string; ordering?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const activeTab = (params.tab ?? "all") as string
  const activeType = activeTab === "all" ? "all" : (activeTab.endsWith("s") ? activeTab.slice(0, -1) : activeTab) as ContactFilters["type"]
  const { q, country, ordering } = params

  const [{ contacts, total }, currencies, countries, categories] = await Promise.all([
    listContacts(
      org.id,
      { type: activeType, q, country },
      { limit: 200 },
      { ordering }
    ),
    getCurrencies(org.id),
    getDistinctCountries(org.id),
    getCategoriesByType(org.id, "contact")
  ])

  return (
    <CustomersView 
      tab={activeTab} 
      data={contacts} 
      total={total}
      currencies={currencies}
      countries={countries}
      categories={categories}
    />
  )
}

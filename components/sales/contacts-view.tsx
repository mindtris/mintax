import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { listContacts, getDistinctCountries, type ContactFilters } from "@/lib/services/contacts"
import { getCurrencies } from "@/lib/services/currencies"
import { CustomersView } from "@/components/contacts/customers-view"

export async function ContactsView({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const { q, country, ordering } = searchParams

  const [{ contacts, total }, currencies, countries] = await Promise.all([
    listContacts(org.id, { type: "client", q, country }, { limit: 200 }, { ordering }),
    getCurrencies(org.id),
    getDistinctCountries(org.id),
  ])

  return (
    <CustomersView
      tab="all"
      data={contacts}
      total={total}
      currencies={currencies}
      countries={countries}
    />
  )
}

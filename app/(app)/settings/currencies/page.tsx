import { addCurrencyAction, deleteCurrencyAction, editCurrencyAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCurrencies } from "@/lib/services/currencies"

export default async function CurrenciesSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const currencies = await getCurrencies(org.id)
  const currenciesWithActions = currencies.map((currency) => ({
    ...currency,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <CrudTable
      title="Currencies"
      description="Custom currencies for unique transaction requirements."
      items={currenciesWithActions}
      columns={[
        { key: "code", label: "Code", editable: true },
        { key: "name", label: "Name", editable: true },
      ]}
      onDelete={async (code) => {
        "use server"
        return await deleteCurrencyAction(org.id, code)
      }}
      onAdd={async (data) => {
        "use server"
        return await addCurrencyAction(org.id, data as { code: string; name: string })
      }}
      onEdit={async (code, data) => {
        "use server"
        return await editCurrencyAction(org.id, code, data as { name: string })
      }}
    />
  )
}

import { addTaxAction, deleteTaxAction, editTaxAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getTaxes } from "@/lib/services/taxes"

export default async function TaxesSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const taxes = await getTaxes(org.id)

  const taxesWithActions = taxes.map((tax) => ({
    ...tax,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <CrudTable
      title="Taxes"
      description="Manage regional tax rates (GST, VAT, Sales Tax) for your organization."
      items={taxesWithActions}
      columns={[
        { key: "name", label: "Tax name", editable: true, type: "text" },
        { key: "rate", label: "Rate (%)", editable: true, type: "number" },
        { key: "type", label: "Type", editable: true, type: "select", options: ["normal", "inclusive"], filterable: true },
        { key: "enabled", label: "Active", editable: true, type: "checkbox", defaultValue: true },
      ]}
      onDelete={async (id) => {
        "use server"
        return await deleteTaxAction(org.id, id)
      }}
      onAdd={async (data) => {
        "use server"
        return await addTaxAction(org.id, data)
      }}
      onEdit={async (id, data) => {
        "use server"
        return await editTaxAction(org.id, id, data)
      }}
    />
  )
}

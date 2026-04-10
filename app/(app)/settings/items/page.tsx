import { addItemAction, deleteItemAction, editItemAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getItems } from "@/lib/services/items"
import { getCategories } from "@/lib/services/categories"
import { getTaxes } from "@/lib/services/taxes"

export default async function ItemsSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const [items, categories, taxes] = await Promise.all([
    getItems(org.id),
    getCategories(org.id),
    getTaxes(org.id)
  ])

  const itemCategories = categories
    .filter(c => c.type === "item")
    .map(c => ({ label: c.name, value: c.id }))

  const taxOptions = taxes.map(t => ({ label: `${t.name} (${t.rate}%)`, value: t.id }))

  const itemsWithActions = items.map((item) => ({
    ...item,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <CrudTable
      title="Products & services"
      description="Define the items you sell or purchase with tax rates and categories for automated bookkeeping."
      items={itemsWithActions}
      columns={[
        { key: "name", label: "Name", editable: true, type: "text" },
        { key: "sku", label: "SKU", editable: true, type: "text" },
        { key: "type", label: "Type", editable: true, type: "select", options: ["product", "service"], filterable: true },
        { key: "salePrice", label: "Sale price", editable: true, type: "number" },
        { key: "categoryId", label: "Category", editable: true, type: "select", complexOptions: itemCategories, filterable: true },
        { key: "taxId", label: "Default tax", editable: true, type: "select", complexOptions: taxOptions },
        { key: "enabled", label: "Active", editable: true, type: "checkbox", defaultValue: true },
      ]}
      onDelete={async (id) => {
        "use server"
        return await deleteItemAction(org.id, id)
      }}
      onAdd={async (data) => {
        "use server"
        return await addItemAction(org.id, data)
      }}
      onEdit={async (id, data) => {
        "use server"
        return await editItemAction(org.id, id, data)
      }}
    />
  )
}

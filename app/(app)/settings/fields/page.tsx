import { addFieldAction, deleteFieldAction, editFieldAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getFields } from "@/lib/services/fields"
import { Prisma } from "@/lib/prisma/client"

export default async function FieldsSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const fields = await getFields(org.id)
  const fieldsWithActions = fields.map((field) => ({
    ...field,
    isEditable: true,
    isDeletable: field.isExtra,
  }))

  return (
    <CrudTable
      title="Custom fields"
      description="Define extra transaction fields for AI analysis or manual entry."
      items={fieldsWithActions}
      columns={[
        { key: "name", label: "Name", editable: true },
        {
          key: "type",
          label: "Type",
          type: "select",
          options: ["string", "number", "boolean"],
          defaultValue: "string",
          editable: true,
          filterable: true,
        },
        { key: "llm_prompt", label: "LLM prompt", editable: true },
        {
          key: "isVisibleInList",
          label: "Show in transactions table",
          type: "checkbox",
          defaultValue: false,
          editable: true,
        },
        {
          key: "isVisibleInAnalysis",
          label: "Show in analysis form",
          type: "checkbox",
          defaultValue: false,
          editable: true,
        },
        {
          key: "isRequired",
          label: "Is required",
          type: "checkbox",
          defaultValue: false,
          editable: true,
        },
      ]}
      onDelete={async (code) => {
        "use server"
        return await deleteFieldAction(org.id, code)
      }}
      onAdd={async (data) => {
        "use server"
        return await addFieldAction(org.id, data as Prisma.FieldCreateInput)
      }}
      onEdit={async (code, data) => {
        "use server"
        return await editFieldAction(org.id, code, data as Prisma.FieldUpdateInput)
      }}
    />
  )
}

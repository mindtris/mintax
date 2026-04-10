import { ImportCSVTable } from "@/components/import/csv"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getFields } from "@/lib/services/fields"

export default async function CSVImportPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const fields = await getFields(org.id)
  return (
    <div className="flex flex-col gap-4">
      <ImportCSVTable fields={fields} />
    </div>
  )
}

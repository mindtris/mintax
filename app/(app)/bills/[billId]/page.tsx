import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getBillById } from "@/lib/services/bills"
import { getFilesByBillId } from "@/lib/services/files"
import { notFound } from "next/navigation"
import { EditBillForm } from "./edit-bill-form"

export default async function EditBillPage({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const [bill, files] = await Promise.all([
    getBillById(billId, org.id),
    getFilesByBillId(billId, org.id),
  ])

  if (!bill) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Bill #{bill.billNumber}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit bill details below. Changes are saved when you click update.
        </p>
      </header>

      <EditBillForm bill={bill} files={files} baseCurrency={org.baseCurrency} />
    </div>
  )
}

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getInvoiceById } from "@/lib/services/invoices"
import { notFound } from "next/navigation"
import { EditInvoiceForm } from "./edit-invoice-form"

export default async function EditInvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const invoice = await getInvoiceById(invoiceId, org.id)

  if (!invoice) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          {invoice.type === "estimate" ? "Estimate" : "Invoice"} #{invoice.invoiceNumber}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit details below. Changes are saved when you click update.
        </p>
      </header>

      <EditInvoiceForm invoice={invoice} baseCurrency={org.baseCurrency} />
    </div>
  )
}

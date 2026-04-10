import { redirect } from "next/navigation"

// Invoice creation moved to a Sheet on the /invoices list page
export default function NewInvoicePageRedirect() {
  redirect("/invoices")
}

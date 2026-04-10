import { redirect } from "next/navigation"

export default function InvoicesLegacyPage() {
  redirect("/sales?tab=invoices")
}

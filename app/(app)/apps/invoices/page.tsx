import { redirect } from "next/navigation"
import { InvoiceTemplate } from "@/app/(app)/apps/invoices/default-templates"

export interface InvoiceAppData {
  templates: InvoiceTemplate[]
}

export default function InvoicesAppRedirect() {
  redirect("/settings?tab=templates")
}

import { redirect } from "next/navigation"

export default function InvoicesAppRedirect() {
  redirect("/settings?tab=templates")
}

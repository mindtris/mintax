import { redirect } from "next/navigation"

export default async function ReconciliationRedirect() {
  redirect("/accounts?tab=reconciliation")
}

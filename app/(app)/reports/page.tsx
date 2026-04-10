import { redirect } from "next/navigation"

export default async function ReportsRedirect() {
  redirect("/accounts?tab=reports")
}

import { redirect } from "next/navigation"

export default async function BillsRedirect() {
  redirect("/accounts?tab=bills")
}

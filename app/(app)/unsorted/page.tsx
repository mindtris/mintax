import { redirect } from "next/navigation"

export default async function UnsortedRedirect() {
  redirect("/accounts?tab=unsorted")
}

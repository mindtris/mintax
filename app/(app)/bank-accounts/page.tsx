import { redirect } from "next/navigation"

export default async function BankAccountsRedirect() {
  redirect("/accounts?tab=bank-accounts")
}

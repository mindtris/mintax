import { redirect } from "next/navigation"

export default function NewBankAccountRedirect() {
  redirect("/accounts?tab=bank-accounts")
}

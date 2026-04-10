import { redirect } from "next/navigation"

// Route renamed: contracts/ → contractors/ (contractors are people, contracts are documents)
export default function ContractorsRedirectPage() {
  redirect("/customers?type=contractor")
}

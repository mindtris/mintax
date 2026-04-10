import { redirect } from "next/navigation"

export default function EstimatesLegacyPage() {
  redirect("/sales?tab=estimates")
}

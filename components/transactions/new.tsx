import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCategories } from "@/lib/services/categories"
import { getCurrencies } from "@/lib/services/currencies"
import { getProjects } from "@/lib/services/projects"
import { getSettings } from "@/lib/services/settings"
import { NewTransactionSheet } from "./new-sheet"

export async function NewTransactionDialog() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const allCategories = await getCategories(org.id)
  const categories = allCategories.filter((c) => c.type === "expense" || c.type === "income")
  const currencies = await getCurrencies(org.id)
  const settings = await getSettings(org.id)
  const projects = await getProjects(org.id)

  return (
    <NewTransactionSheet
      categories={categories}
      currencies={currencies}
      settings={settings}
      projects={projects}
    />
  )
}

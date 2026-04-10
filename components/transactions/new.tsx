import { getCurrentUser } from "@/lib/core/auth"
import { getCategories } from "@/lib/services/categories"
import { getCurrencies } from "@/lib/services/currencies"
import { getProjects } from "@/lib/services/projects"
import { getSettings } from "@/lib/services/settings"
import { NewTransactionSheet } from "./new-sheet"

export async function NewTransactionDialog() {
  const user = await getCurrentUser()
  const categories = await getCategories(user.id)
  const currencies = await getCurrencies(user.id)
  const settings = await getSettings(user.id)
  const projects = await getProjects(user.id)

  return (
    <NewTransactionSheet
      categories={categories}
      currencies={currencies}
      settings={settings}
      projects={projects}
    />
  )
}

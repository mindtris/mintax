import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCategories } from "@/lib/services/categories"
import { getCurrencies } from "@/lib/services/currencies"
import { getProjects } from "@/lib/services/projects"
import { getSettings } from "@/lib/services/settings"
import { getBankAccounts } from "@/lib/services/bank-accounts"
import { getTaxes } from "@/lib/services/taxes"
import { NewTransactionSheet } from "./new-sheet"

export async function NewTransactionDialog() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const [
    allCategories,
    currencies,
    settings,
    projects,
    bankAccounts,
    taxes,
  ] = await Promise.all([
    getCategories(org.id),
    getCurrencies(org.id),
    getSettings(org.id),
    getProjects(org.id),
    getBankAccounts(org.id),
    getTaxes(org.id),
  ])
  const categories = allCategories.filter((c) => c.type === "expense" || c.type === "income")

  return (
    <NewTransactionSheet
      categories={categories}
      currencies={currencies}
      settings={settings}
      projects={projects}
      bankAccounts={bankAccounts}
      taxes={taxes}
    />
  )
}

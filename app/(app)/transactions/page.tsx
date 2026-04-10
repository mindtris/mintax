import { redirect } from "next/navigation"
import { TransactionFilters } from "@/lib/services/transactions"

export default async function TransactionsRedirect({ searchParams }: { searchParams: Promise<TransactionFilters> }) {
  const filters = await searchParams
  const params = new URLSearchParams(filters as any)
  params.set("tab", "transactions")
  redirect(`/accounts?${params.toString()}`)
}

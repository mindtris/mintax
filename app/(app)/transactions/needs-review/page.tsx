import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getTransactions } from "@/lib/services/transactions"
import { NeedsReviewClient } from "./client"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Needs review" }

export default async function NeedsReviewPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const { transactions } = await getTransactions(
    org.id,
    { status: "needs_review" },
    { limit: 100, offset: 0 },
  )

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Needs review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-imported transactions awaiting your approval. Review the details, edit if needed, then approve.
        </p>
      </header>

      <NeedsReviewClient transactions={transactions} />
    </div>
  )
}

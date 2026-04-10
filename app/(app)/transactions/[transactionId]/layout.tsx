import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getTransactionById } from "@/lib/services/transactions"
import { notFound } from "next/navigation"

export default async function TransactionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ transactionId: string }>
}) {
  const { transactionId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const transaction = await getTransactionById(transactionId, org.id)

  if (!transaction) {
    notFound()
  }

  return (
    <>
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Transaction Details</h2>
      </header>
      <main>
        <div className="flex flex-1 flex-col gap-4 pt-0">{children}</div>
      </main>
    </>
  )
}

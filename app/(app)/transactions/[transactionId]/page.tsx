import { FormTextarea } from "@/components/forms/simple"
import TransactionEditForm from "@/components/transactions/edit"
import TransactionFiles from "@/components/transactions/transaction-files"
import { Card } from "@/components/ui/card"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { incompleteTransactionFields } from "@/lib/stats"
import { getCategories } from "@/lib/services/categories"
import { getCurrencies } from "@/lib/services/currencies"
import { getFields } from "@/lib/services/fields"
import { getFilesByTransactionId } from "@/lib/services/files"
import { getProjects } from "@/lib/services/projects"
import { getSettings } from "@/lib/services/settings"
import { getTransactionById } from "@/lib/services/transactions"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function TransactionPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const transaction = await getTransactionById(transactionId, org.id)
  if (!transaction) {
    notFound()
  }

  const files = await getFilesByTransactionId(transactionId, org.id)
  const categories = await getCategories(org.id)
  const currencies = await getCurrencies(org.id)
  const settings = await getSettings(org.id)
  const fields = await getFields(org.id)
  const projects = await getProjects(org.id)
  const incompleteFields = incompleteTransactionFields(fields, transaction)

  return (
    <div className="flex flex-wrap flex-row items-start justify-center gap-4 max-w-6xl">
      <Card className="w-full flex-1 flex flex-col flex-wrap justify-center items-start overflow-hidden bg-card border-border">
        {incompleteFields.length > 0 && (
          <div className="w-full flex flex-col gap-1 rounded-md bg-muted p-5">
            <span>
              Some fields are incomplete: <strong>{incompleteFields.map((field) => field.name).join(", ")}</strong>
            </span>
            <span className="text-xs text-muted-foreground">
              You can decide which fields are required for you in{" "}
              <Link href="/settings?tab=fields" className="underline">
                Fields settings
              </Link>
              .
            </span>
          </div>
        )}
        <div className="w-full p-5">
          <TransactionEditForm
            transaction={transaction}
            categories={categories}
            currencies={currencies}
            settings={settings}
            fields={fields}
            projects={projects}
          />

          {transaction.text && (
            <details className="mt-10">
              <summary className="cursor-pointer text-sm font-medium">Recognized Text</summary>
              <Card className="flex items-stretch p-2 max-w-6xl">
                <div className="flex-1">
                  <FormTextarea
                    name="text"
                    defaultValue={transaction.text || ""}
                    hideIfEmpty={true}
                    className="w-full h-[400px]"
                  />
                </div>
              </Card>
            </details>
          )}
        </div>
      </Card>

      <div className="w-1/2 max-w-[400px] space-y-4">
        <TransactionFiles transaction={transaction} files={files} />
      </div>
    </div>
  )
}

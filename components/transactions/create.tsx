"use client"

import { createTransactionAction } from "@/app/(app)/transactions/actions"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Category, Currency, Project } from "@/lib/prisma/client"
import { format } from "date-fns"
import { Import, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"

export default function TransactionCreateForm({
  categories,
  projects,
  currencies,
  settings,
}: {
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  settings: Record<string, string>
}) {
  const router = useRouter()
  const [createState, createAction, isCreating] = useActionState(createTransactionAction, null)
  const [formData, setFormData] = useState({
    name: "",
    merchant: "",
    description: "",
    total: 0.0,
    convertedTotal: 0.0,
    currencyCode: settings.default_currency,
    convertedCurrencyCode: settings.default_currency,
    type: settings.default_type,
    categoryCode: settings.default_category,
    projectCode: settings.default_project,
    issuedAt: format(new Date(), "yyyy-MM-dd"),
    note: "",
  })

  useEffect(() => {
    if (createState?.success && createState.data) {
      router.push(`/transactions/${createState.data.id}`)
    }
  }, [createState, router])

  return (
    <form action={createAction} className="flex flex-col h-full">
      {/* Scrollable form fields */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <FormInput title="Name" name="name" defaultValue={formData.name} />

        <FormInput title="Merchant" name="merchant" defaultValue={formData.merchant} />

        <FormInput title="Description" name="description" defaultValue={formData.description} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput title="Total" type="number" step="0.01" name="total" defaultValue={formData.total.toFixed(2)} className="w-full" />

          <FormSelectCurrency
            title="Currency"
            name="currencyCode"
            currencies={currencies}
            placeholder="Select Currency"
            value={formData.currencyCode}
            onValueChange={(value) => {
              setFormData({ ...formData, currencyCode: value })
            }}
          />

          <FormSelectType title="Type" name="type" defaultValue={formData.type} />
        </div>

        {formData.currencyCode !== settings.default_currency ? (
          <div className="flex flex-row gap-4">
            <FormInput
              title={`Converted to ${settings.default_currency}`}
              type="number"
              step="0.01"
              name="convertedTotal"
              defaultValue={formData.convertedTotal.toFixed(2)}
            />
          </div>
        ) : (
          <></>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Issued at</Label>
            <DatePicker name="issuedAt" defaultValue={formData.issuedAt} placeholder="Pick a date" />
          </div>

          <FormSelectCategory
            title="Category"
            categories={categories}
            name="categoryCode"
            defaultValue={formData.categoryCode}
            placeholder="Select Category"
          />

          <FormSelectProject
            title="Project"
            projects={projects}
            name="projectCode"
            defaultValue={formData.projectCode}
            placeholder="Select Project"
          />
        </div>

        <FormTextarea title="Note" name="note" defaultValue={formData.note} />

        {createState?.error && <FormError>{createState.error}</FormError>}
      </div>

      {/* Fixed footer */}
      <div className="shrink-0 pt-4 mt-4 flex justify-between items-center gap-4">
        <Button type="button" variant="outline" size="icon" asChild>
          <Link href="/import/csv">
            <Import className="h-4 w-4" />
          </Link>
        </Button>

        <Button type="submit" disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create and Add Files"
          )}
        </Button>
      </div>
    </form>
  )
}

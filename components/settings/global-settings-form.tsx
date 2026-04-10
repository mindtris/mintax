"use client"

import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectType } from "@/components/forms/select-type"
import { Button } from "@/components/ui/button"
import { Category, Currency } from "@/lib/prisma/client"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

export default function GlobalSettingsForm({
  settings,
  currencies,
  categories,
}: {
  settings: Record<string, string>
  currencies: Currency[]
  categories: Category[]
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  useEffect(() => {
    if (saveState?.success) toast.success("Settings saved")
    if (saveState?.error) toast.error(saveState.error)
  }, [saveState])

  return (
    <form action={saveAction} className="space-y-4">
      <FormSelectCurrency
        title="Default currency"
        name="default_currency"
        defaultValue={settings.default_currency}
        currencies={currencies}
      />

      <FormSelectType title="Default transaction type" name="default_type" defaultValue={settings.default_type} />

      <FormSelectCategory
        title="Default transaction category"
        name="default_category"
        defaultValue={settings.default_category}
        categories={categories}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </Button>

      {saveState?.error && <FormError>{saveState.error}</FormError>}
    </form>
  )
}

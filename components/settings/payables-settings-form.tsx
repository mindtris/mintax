"use client"

import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Category } from "@/lib/prisma/client"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

export default function PayablesSettingsForm({
  settings,
  categories,
}: {
  settings: Record<string, string>
  categories: Category[]
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  useEffect(() => {
    if (saveState?.success) toast.success("Settings saved")
    if (saveState?.error) toast.error(saveState.error)
  }, [saveState])

  return (
    <form action={saveAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="bill_prefix">Default bill prefix</Label>
        <Input
          id="bill_prefix"
          name="bill_prefix"
          defaultValue={settings.bill_prefix || "BILL-"}
          placeholder="e.g. BILL-"
        />
        <p className="text-[10px] text-muted-foreground">This prefix will be applied to all new automated bills.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bill_default_due_days">Default payment terms (days)</Label>
        <Input
          id="bill_default_due_days"
          name="bill_default_due_days"
          type="number"
          defaultValue={settings.bill_default_due_days || "30"}
          placeholder="30"
        />
        <p className="text-[10px] text-muted-foreground">Default number of days until a bill is marked as overdue.</p>
      </div>

      <FormSelectCategory
        title="Default bill category"
        name="bill_default_category"
        defaultValue={settings.bill_default_category || "utility_bills"}
        categories={categories}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </Button>

      {saveState?.error && <FormError>{saveState.error}</FormError>}
    </form>
  )
}

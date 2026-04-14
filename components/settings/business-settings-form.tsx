"use client"

import { saveBusinessAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectType } from "@/components/forms/select-type"
import { FormAvatar, FormInput, FormSelect, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Category, Currency, Organization, User } from "@/lib/prisma/client"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

const STRUCTURES = [
  { code: "sole_proprietorship", name: "Sole Proprietorship" },
  { code: "partnership", name: "Partnership" },
  { code: "llc", name: "Limited Liability Company (LLC)" },
  { code: "corporation", name: "Corporation" },
  { code: "other", name: "Other" },
]

const MONTHS = [
  { code: "1", name: "January" },
  { code: "2", name: "February" },
  { code: "3", name: "March" },
  { code: "4", name: "April" },
  { code: "5", name: "May" },
  { code: "6", name: "June" },
  { code: "7", name: "July" },
  { code: "8", name: "August" },
  { code: "9", name: "September" },
  { code: "10", name: "October" },
  { code: "11", name: "November" },
  { code: "12", name: "December" },
]

const CURRENCIES = [
  { code: "INR", name: "INR Indian Rupee" },
  { code: "USD", name: "USD US Dollar" },
  { code: "EUR", name: "EUR Euro" },
  { code: "GBP", name: "GBP British Pound" },
  { code: "AUD", name: "AUD Australian Dollar" },
  { code: "CAD", name: "CAD Canadian Dollar" },
  { code: "SGD", name: "SGD Singapore Dollar" },
  { code: "JPY", name: "JPY Japanese Yen" },
  { code: "AED", name: "AED UAE Dirham" },
]

export default function BusinessSettingsForm({ org, user, settings, currencies, categories }: { org: any; user: User; settings: Record<string, string>; currencies: Currency[]; categories: Category[] }) {
  const [saveState, saveAction, pending] = useActionState(saveBusinessAction, null)

  useEffect(() => {
    if (saveState?.success) toast.success("Business settings saved")
    if (saveState?.error) toast.error(saveState.error)
  }, [saveState])

  return (
    <div className="flex flex-col gap-10">
      <form action={saveAction} className="flex flex-col gap-8 max-w-3xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <FormAvatar
              title="Business logo"
              name="logo"
              className="w-40 h-40 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors"
              defaultValue={org.logo ?? ""}
            />
            <div className="flex-1 flex flex-col gap-4 w-full">
              <FormInput
                title="Business name"
                name="name"
                placeholder="Mindtris"
                defaultValue={org.name ?? ""}
                className="text-lg font-semibold"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  title="Organization type"
                  name="type"
                  defaultValue={org.type || "business"}
                  items={[
                    { code: "business", name: "Business" },
                    { code: "personal", name: "Personal (Simplified)" },
                  ]}
                />
                <FormInput
                  title="Website"
                  name="website"
                  placeholder="https://mindtris.com"
                  defaultValue={org.website ?? ""}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              title="Business phone"
              name="phone"
              placeholder="+1 (555) 000-0000"
              defaultValue={org.phone ?? ""}
            />
            <FormInput
              title="Registration / tax number"
              name="registrationNumber"
              placeholder="UEN, EIN, CIF, etc."
              defaultValue={org.registrationNumber ?? ""}
            />
          </div>

          <div className="pt-6 border-t">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Structure & industry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                title="Business structure"
                name="businessStructure"
                defaultValue={org.businessStructure || "sole_proprietorship"}
                items={STRUCTURES}
              />
              <FormInput
                title="Industry"
                name="industry"
                placeholder="Software, Retail, Consulting..."
                defaultValue={org.industry ?? ""}
              />
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Fiscal & regional settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelect
                title="Base currency"
                name="baseCurrency"
                defaultValue={org.baseCurrency || "INR"}
                items={CURRENCIES}
              />
              <FormSelect
                title="Fiscal year start"
                name="fiscalYearStart"
                defaultValue={org.fiscalYearStart?.toString() || "1"}
                items={MONTHS}
              />
              <FormInput
                title="Tax ID (GSTIN / VAT)"
                name="taxId"
                placeholder="Tax identification"
                defaultValue={org.taxId ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
            <FormTextarea
              title="Headquarters address"
              name="address"
              placeholder="Full physical address..."
              defaultValue={org.address ?? ""}
              rows={3}
            />
            <FormTextarea
              title="Default bank details"
              name="bankDetails"
              placeholder="Bank Name, SWIFT, Account Number..."
              defaultValue={org.bankDetails ?? ""}
              rows={3}
            />
          </div>

          <div className="pt-6 border-t">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Transaction defaults
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelectCurrency
                title="Default currency"
                name="default_currency"
                defaultValue={settings.default_currency}
                currencies={currencies}
              />
              <FormSelectType
                title="Default transaction type"
                name="default_type"
                defaultValue={settings.default_type}
              />
              <FormSelectCategory
                title="Default transaction category"
                name="default_category"
                defaultValue={settings.default_category}
                categories={categories}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save settings"}
          </Button>
        </div>

        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </form>
    </div>
  )
}

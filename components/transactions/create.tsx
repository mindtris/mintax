"use client"

import { createTransactionAction } from "@/app/(app)/transactions/actions"
import { ContactPicker } from "@/components/contacts/contact-picker"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BankAccount, Category, Currency, Project, Tax } from "@/lib/prisma/client"
import { format } from "date-fns"
import { Loader2, Paperclip, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef, useState } from "react"

const PAYMENT_METHODS = [
  { code: "cash", name: "Cash" },
  { code: "bank_transfer", name: "Bank transfer" },
  { code: "upi", name: "UPI" },
  { code: "card", name: "Card" },
  { code: "cheque", name: "Cheque" },
  { code: "other", name: "Other" },
]

interface Props {
  categories: Category[]
  currencies: Currency[]
  projects: Project[]
  bankAccounts: BankAccount[]
  taxes: Tax[]
  settings: Record<string, string>
  onSuccess?: () => void
}

export default function TransactionCreateForm({
  categories,
  currencies,
  projects,
  bankAccounts,
  taxes,
  settings,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [createState, createAction, isCreating] = useActionState(createTransactionAction, null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receipts, setReceipts] = useState<File[]>([])

  const [contactId, setContactId] = useState("")
  const [merchant, setMerchant] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [bankAccountId, setBankAccountId] = useState("")
  const [chartAccountId, setChartAccountId] = useState("")
  const [taxId, setTaxId] = useState("")
  const [currencyCode, setCurrencyCode] = useState(settings.default_currency || "INR")

  useEffect(() => {
    if (createState?.success && createState.data) {
      onSuccess?.()
      router.push(`/transactions/${createState.data.id}`)
      router.refresh()
    }
  }, [createState, router, onSuccess])

  async function handleContactSelect(contact: any) {
    if (!contact) {
      setContactId("")
      setMerchant("")
      return
    }
    setContactId(contact.id || "")
    setMerchant(contact.name || "")

    // Vendor memory — pull defaults from this vendor's last transactions
    if (contact.id) {
      try {
        const res = await fetch(`/api/vendor-defaults?contactId=${contact.id}`)
        if (res.ok) {
          const { defaults } = await res.json()
          if (defaults?.paymentMethod) setPaymentMethod(defaults.paymentMethod)
          if (defaults?.bankAccountId) setBankAccountId(defaults.bankAccountId)
          if (defaults?.chartAccountId) setChartAccountId(defaults.chartAccountId)
          if (defaults?.taxRate) setTaxId(defaults.taxRate)
        }
      } catch {
        // silent — vendor memory is best-effort
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setReceipts((prev) => [...prev, ...files])
  }

  function removeReceipt(index: number) {
    setReceipts((prev) => prev.filter((_, i) => i !== index))
  }

  // Use a ref-based form action so we can attach files via FormData
  async function handleSubmit(formData: FormData) {
    receipts.forEach((file) => formData.append("receipts", file))
    return createAction(formData)
  }

  return (
    <form action={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-8 overflow-y-auto">
        {/* ── General ───────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              General
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Date, account, amount, and description for this transaction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Date</Label>
              <DatePicker
                name="issuedAt"
                defaultValue={format(new Date(), "yyyy-MM-dd")}
                placeholder="Pick a date"
              />
            </div>

            <FormSelectType title="Type" name="type" defaultValue={settings.default_type || "expense"} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Payment method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Account</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">No accounts yet</div>
                  ) : (
                    bankAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency || ""})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input type="hidden" name="bankAccountId" value={bankAccountId} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              title="Amount"
              type="number"
              step="0.01"
              name="total"
              defaultValue="0.00"
            />

            <FormSelectCurrency
              title="Currency"
              name="currencyCode"
              currencies={currencies}
              placeholder="Select currency"
              value={currencyCode}
              onValueChange={setCurrencyCode}
            />
          </div>

          <FormInput title="Name" name="name" placeholder="Short summary" />

          <FormTextarea title="Description" name="description" placeholder="Optional details" />
        </section>

        {/* ── Assign ────────────────────────────────────────────── */}
        <section className="space-y-4 pt-2 border-t">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mt-4">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Assign
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Link this transaction to a vendor, category, and chart of accounts for better reports.
            </p>
          </div>

          <FormSelectCategory
            title="Category"
            categories={categories}
            name="categoryCode"
            defaultValue={settings.default_category}
            placeholder="Select category"
          />
          {/* Chart of account is auto-derived from category defaults / vendor memory */}
          <input type="hidden" name="chartAccountId" value={chartAccountId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Vendor</Label>
              <ContactPicker
                onSelect={handleContactSelect}
                defaultName={merchant}
                defaultContactId={contactId}
              />
              <input type="hidden" name="contactId" value={contactId} />
              <input type="hidden" name="merchant" value={merchant} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Tax</Label>
              <Select value={taxId} onValueChange={setTaxId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tax" />
                </SelectTrigger>
                <SelectContent>
                  {taxes.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">No taxes configured</div>
                  ) : (
                    taxes.map((tax) => (
                      <SelectItem key={tax.id} value={tax.id}>
                        {tax.name} ({tax.rate}%)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input type="hidden" name="taxRate" value={taxId} />
            </div>
          </div>

          <FormSelectProject
            title="Project"
            projects={projects}
            name="projectCode"
            defaultValue={settings.default_project}
            placeholder="Select project"
          />
        </section>

        {/* ── Other ─────────────────────────────────────────────── */}
        <section className="space-y-4 pt-2 border-t">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mt-4">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Other
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-numbered. Add a reference and attach receipts if needed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              title="Number"
              name="number"
              placeholder="Auto-generated (e.g. TRA-00001)"
            />

            <FormInput title="Reference" name="reference" placeholder="PO number, check, etc." />
          </div>

          <FormTextarea title="Note" name="note" placeholder="Internal note" />

          {/* Attachments */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Attachment</Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
            >
              <Paperclip className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload receipts
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                PDF, PNG, JPG, etc.
              </p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {receipts.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                {receipts.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between text-xs px-3 py-2 rounded-md bg-muted/40"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeReceipt(i)}
                      className="text-muted-foreground hover:text-destructive ml-2"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {createState?.error && <FormError>{createState.error}</FormError>}
      </div>

      {/* Footer */}
      <div className="shrink-0 pt-4 mt-4 flex justify-end items-center gap-2 border-t">
        <Button type="button" variant="secondary" onClick={() => onSuccess?.()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create transaction"
          )}
        </Button>
      </div>
    </form>
  )
}

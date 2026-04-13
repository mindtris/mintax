"use client"

import { createTransactionAction } from "@/app/(app)/transactions/actions"
import { analyzePendingReceiptAction } from "@/app/(app)/transactions/analyze-receipt-action"
import { quickAddBankAccountAction } from "@/app/(app)/transactions/quick-add-actions"
import { NewBankAccountSheet } from "@/components/bank-accounts/new-account-sheet"
import { ContactPicker } from "@/components/contacts/contact-picker"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { BankAccount, Category, Currency, Project, Tax } from "@/lib/prisma/client"
import {
  ACCOUNT_CATEGORY_LABELS,
  getAccountCategory,
  type AccountCategory,
} from "@/lib/accounts/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

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

type AttachedFile = {
  fileId: string
  filename: string
  mimetype: string
  analyzing: boolean
  analyzed: boolean
}

export default function TransactionCreateForm({
  categories,
  currencies,
  projects,
  bankAccounts: initialBankAccounts,
  taxes,
  settings,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [createState, createAction, isCreating] = useActionState(createTransactionAction, null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local copy of bank accounts so inline-created ones appear immediately
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts)
  const [addAccountOpen, setAddAccountOpen] = useState(false)

  // File attachment state
  const [attached, setAttached] = useState<AttachedFile | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Form state
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [amount, setAmount] = useState("")
  const [currencyCode, setCurrencyCode] = useState(settings.default_currency || "INR")
  const [bankAccountId, setBankAccountId] = useState("")
  const [contactId, setContactId] = useState("")
  const [merchant, setMerchant] = useState("")
  const [categoryCode, setCategoryCode] = useState(settings.default_category || "")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [description, setDescription] = useState("")
  const [taxId, setTaxId] = useState("")
  const [projectCode, setProjectCode] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (createState?.success && createState.data) {
      onSuccess?.()
      router.push(`/transactions/${createState.data.id}`)
      router.refresh()
    }
  }, [createState, router, onSuccess])

  // ── File handling ────────────────────────────────────────────────────
  async function handleFileSelected(file: File) {
    if (!file) return
    setAttached({
      fileId: "pending",
      filename: file.name,
      mimetype: file.type,
      analyzing: true,
      analyzed: false,
    })

    const fd = new FormData()
    fd.append("file", file)
    const result = await analyzePendingReceiptAction(null, fd)

    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to upload file")
      setAttached(null)
      return
    }

    setAttached({
      fileId: result.data.fileId,
      filename: result.data.filename,
      mimetype: result.data.mimetype,
      analyzing: false,
      analyzed: result.data.analyzed,
    })

    if (result.data.extracted) {
      const e = result.data.extracted
      if (e.issuedAt) setDate(e.issuedAt)
      if (e.total != null) setAmount((e.total / 100).toFixed(2))
      if (e.currencyCode) setCurrencyCode(e.currencyCode)
      if (e.contactId) setContactId(e.contactId)
      if (e.merchant) setMerchant(e.merchant)
      if (e.categoryCode) setCategoryCode(e.categoryCode)
      if (e.taxRate) setTaxId(e.taxRate)
      if (e.projectCode) setProjectCode(e.projectCode)
      if (e.description) setDescription(e.description)
      else if (e.name) setDescription(e.name)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelected(file)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function removeAttached() {
    if (attached) {
      toast.info("Receipt saved to Unsorted — you can use it later")
    }
    setAttached(null)
  }

  function handleContactSelect(contact: any) {
    if (!contact) {
      setContactId("")
      setMerchant("")
      return
    }
    setContactId(contact.id || "")
    setMerchant(contact.name || "")
  }

  // ── Submit ───────────────────────────────────────────────────────────
  async function handleSubmit(formData: FormData) {
    if (attached && attached.fileId !== "pending") {
      formData.append("attachFileIds", JSON.stringify([attached.fileId]))
    }
    return createAction(formData)
  }

  return (
    <form action={handleSubmit} className="flex flex-col">
      {/* Hidden inputs for form state (ContactPicker emits its own contactId) */}
      <input type="hidden" name="issuedAt" value={date} />
      <input type="hidden" name="merchant" value={merchant} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="bankAccountId" value={bankAccountId} />
      <input type="hidden" name="taxRate" value={taxId} />
      <input type="hidden" name="type" value={settings.default_type || "expense"} />

      <div className="space-y-4">
        {/* ── Drop zone ───────────────────────────────────────────── */}
        {!attached ? (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
              isDragOver
                ? "border-primary/60 bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30",
            )}
          >
            <Upload className="h-6 w-6 text-muted-foreground/70" />
            <div className="text-center">
              <p className="text-sm font-medium">Drop a receipt to auto-fill</p>
              <p className="text-xs text-muted-foreground">
                PDF or image · or click to browse
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(file)
              }}
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center gap-3 h-12 px-3 rounded-lg border bg-muted/30",
              attached.analyzing && "animate-pulse",
            )}
          >
            {attached.analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            ) : attached.analyzed ? (
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attached.filename}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {attached.analyzing
                  ? "Analyzing with AI…"
                  : attached.analyzed
                    ? "Auto-filled from receipt"
                    : "Attached"}
              </p>
            </div>
            <button
              type="button"
              onClick={removeAttached}
              disabled={attached.analyzing}
              className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Core fields ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Date</Label>
            <DatePicker
              name="issuedAt_display"
              defaultValue={date}
              placeholder="Pick a date"
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Amount</Label>
            <Input
              type="number"
              step="0.01"
              name="total"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Account</Label>
            <Select
              value={bankAccountId}
              onValueChange={(v) => {
                if (v === "__add_new__") {
                  // Open the inline sheet instead of navigating away
                  setAddAccountOpen(true)
                  return
                }
                setBankAccountId(v)
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.length === 0 ? (
                  <div className="px-2 py-6 text-center">
                    <p className="text-xs text-muted-foreground mb-2">No accounts yet</p>
                  </div>
                ) : (
                  (["asset", "liability", "equity"] as AccountCategory[]).map((cat) => {
                    const groupAccounts = bankAccounts.filter(
                      (a) => getAccountCategory(a.accountType) === cat,
                    )
                    if (groupAccounts.length === 0) return null
                    return (
                      <SelectGroup key={cat}>
                        <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                          {ACCOUNT_CATEGORY_LABELS[cat]}
                        </SelectLabel>
                        {groupAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                            {acc.currency ? (
                              <span className="text-muted-foreground"> ({acc.currency})</span>
                            ) : null}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  })
                )}
                <SelectSeparator />
                <SelectItem
                  value="__add_new__"
                  className="text-primary focus:text-primary focus:bg-primary/10"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Add a new account
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ContactPicker
            onSelect={handleContactSelect}
            defaultName={merchant}
            defaultContactId={contactId}
            type="vendor"
            triggerClassName="h-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormSelectCategory
            title="Category"
            categories={categories}
            name="categoryCode"
            value={categoryCode}
            onValueChange={setCategoryCode}
            placeholder="Select category"
            triggerClassName="h-10"
            addNewHref="/settings?tab=categories"
            addNewLabel="Add a new category"
          />
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Payment method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-10">
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
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-sm font-medium">Description</Label>
          <Textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this for?"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* ── Advanced ────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")}
          />
          More options
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Tax</Label>
                <Select
                  value={taxId}
                  onValueChange={(v) => {
                    if (v === "__add_new__") {
                      window.open("/settings?tab=taxes", "_blank")
                      return
                    }
                    setTaxId(v)
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select tax" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxes.length > 0 &&
                      taxes.map((tax) => (
                        <SelectItem key={tax.id} value={tax.id}>
                          {tax.name} ({tax.rate}%)
                        </SelectItem>
                      ))}
                    <SelectSeparator />
                    <SelectItem
                      value="__add_new__"
                      className="text-primary focus:text-primary focus:bg-primary/10"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5" />
                        Add a new tax
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormSelectProject
                title="Project"
                projects={projects}
                name="projectCode"
                value={projectCode}
                onValueChange={setProjectCode}
                placeholder="Select project"
                triggerClassName="h-10"
                addNewHref="/settings?tab=projects"
                addNewLabel="Add a new project"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormSelectCurrency
                title="Currency"
                name="currencyCode"
                currencies={currencies}
                value={currencyCode}
                onValueChange={setCurrencyCode}
                placeholder="Currency"
                triggerClassName="h-10"
                addNewHref="/settings?tab=currencies"
                addNewLabel="Add a new currency"
              />
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Reference</Label>
                <Input
                  name="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="PO #, check #, etc."
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Internal note</Label>
              <Textarea
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Only visible to your team"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        )}

        {createState?.error && <FormError>{createState.error}</FormError>}
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="pt-4 mt-6 border-t">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onSuccess?.()}
            className="h-10"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || !!attached?.analyzing} className="h-10">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save transaction"
            )}
          </Button>
        </div>
      </div>

      {/* Inline sheet for adding a new bank account without leaving the form */}
      <NewBankAccountSheet
        hideTrigger
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        baseCurrency={settings.default_currency || "INR"}
        currencies={currencies.map((c) => ({ code: c.code, name: c.name }))}
        onAdd={quickAddBankAccountAction}
        onCreated={(account) => {
          setBankAccounts((prev) => [...prev, account])
          setBankAccountId(account.id)
        }}
      />
    </form>
  )
}

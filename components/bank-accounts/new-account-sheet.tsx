"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { PlaidLinkButton } from "@/components/bank-accounts/plaid-link-button"
import {
  ACCOUNT_CATEGORY_LABELS,
  getAccountCategory,
  getGroupedSubtypes,
} from "@/lib/accounts/types"

interface NewBankAccountSheetProps {
  baseCurrency?: string
  currencies?: Array<{ code: string; name: string }>
  onAdd: (data: {
    name: string
    accountNumber?: string
    bankName?: string
    ifscCode?: string
    accountType?: string
    currency?: string
  }) => Promise<{ success: boolean; error?: string; data?: any }>
  children?: React.ReactNode
  /** Optional controlled open state (overrides internal state if provided) */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Called with the created account when onAdd succeeds and returns data */
  onCreated?: (account: any) => void
  /** Hide the default trigger button when using controlled state */
  hideTrigger?: boolean
}

export function NewBankAccountSheet({
  baseCurrency = "INR",
  currencies,
  onAdd,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onCreated,
  hideTrigger = false,
}: NewBankAccountSheetProps) {
  const currencyOptions = currencies && currencies.length > 0
    ? currencies
    : [{ code: baseCurrency, name: baseCurrency }]
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) controlledOnOpenChange?.(v)
    else setInternalOpen(v)
  }
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    accountType: "cash_and_bank",
    currency: baseCurrency,
  })

  const groupedSubtypes = getGroupedSubtypes()
  const selectedCategory = getAccountCategory(form.accountType)
  // Only real banks need bank name / account number / IFSC
  const showBankFields = form.accountType === "cash_and_bank"

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Account name is required")
      return
    }
    setSaving(true)
    try {
      const result = await onAdd({
        name: form.name.trim(),
        accountNumber: form.accountNumber || undefined,
        bankName: form.bankName || undefined,
        ifscCode: form.ifscCode || undefined,
        accountType: form.accountType,
        currency: form.currency,
      })
      if (result.success) {
        setOpen(false)
        setForm({ name: "", accountNumber: "", bankName: "", ifscCode: "", accountType: "cash_and_bank", currency: baseCurrency })
        if (result.data) onCreated?.(result.data)
      } else {
        toast.error(result.error || "Failed to add account")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to add account")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {!hideTrigger && (children ? (
        <div onClick={() => setOpen(true)}>{children}</div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Add account</span>
        </Button>
      ))}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Add an account</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {/* Account type — grouped by Asset / Liability / Equity */}
            <div className="space-y-2">
              <Label>
                Account type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.accountType}
                onValueChange={(v) => setForm((p) => ({ ...p, accountType: v }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select an account type…" />
                </SelectTrigger>
                <SelectContent>
                  {(["asset", "liability", "equity"] as const).map((cat) => (
                    <SelectGroup key={cat}>
                      <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                        {ACCOUNT_CATEGORY_LABELS[cat]}
                      </SelectLabel>
                      {groupedSubtypes[cat].map((subtype) => (
                        <SelectItem key={subtype.code} value={subtype.code}>
                          {subtype.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ba-name">
                Account name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ba-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={
                  form.accountType === "cash_and_bank"
                    ? "Business checking"
                    : form.accountType === "credit_card"
                      ? "Corporate AmEx"
                      : form.accountType === "loan"
                        ? "Equipment loan"
                        : "Account name"
                }
                className="h-10"
              />
            </div>

            {/* Bank connect — only for Cash and Bank subtype */}
            {showBankFields && (
              <>
                <div className="space-y-2 rounded-lg border bg-[#f5f4ef] p-4 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#141413]">Connect a bank automatically</p>
                    <p className="text-xs text-muted-foreground">
                      Link a US, Canada, or UK bank via Plaid to pull transactions and balances automatically.
                    </p>
                  </div>
                  <PlaidLinkButton onLinked={() => setOpen(false)} />
                  <p className="text-[11px] text-muted-foreground">
                    Indian banks: fill the manual fields below.
                  </p>
                </div>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">Or add manually</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ba-bank">Bank name</Label>
                  <Input
                    id="ba-bank"
                    value={form.bankName}
                    onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                    placeholder="State Bank of India"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ba-number">Account number</Label>
                  <Input
                    id="ba-number"
                    value={form.accountNumber}
                    onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    placeholder="1234567890"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ba-ifsc">IFSC / routing code</Label>
                  <Input
                    id="ba-ifsc"
                    value={form.ifscCode}
                    onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value }))}
                    placeholder="SBIN0001234"
                    className="h-10"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Adding..." : "Add account"}
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

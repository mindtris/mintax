"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useActionState, useState } from "react"
import { createRecurringAction } from "./actions"

export function NewRecurringSheet({
  children,
  baseCurrency = "INR",
}: {
  children?: React.ReactNode
  baseCurrency?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createRecurringAction, null)

  if (state?.success && open) {
    setTimeout(() => setOpen(false), 0)
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>New recurring transaction</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Name *</Label>
              <Input name="name" placeholder="e.g., Office Rent" required />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Merchant</Label>
              <Input name="merchant" placeholder="e.g., WeWork" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Amount *</Label>
                <Input name="total" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Select name="currencyCode" defaultValue={baseCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select name="type" defaultValue="expense">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Recurrence *</Label>
                <Select name="recurrence" defaultValue="monthly">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Starts on *</Label>
                <Input name="nextRunAt" type="date" defaultValue={today} required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>End date (optional)</Label>
              <Input name="endAt" type="date" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Note</Label>
              <Textarea name="note" placeholder="Monthly office rent payment" rows={2} />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending} className="w-full mt-2">
              {pending ? "Creating..." : "Create recurring transaction"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

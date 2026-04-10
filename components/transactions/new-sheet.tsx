"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Category, Currency, Project } from "@/lib/prisma/client"
import { useState } from "react"
import TransactionCreateForm from "./create"
import { AddTransactionMenu } from "./add-transaction-menu"

interface NewTransactionSheetProps {
  categories: Category[]
  currencies: Currency[]
  settings: Record<string, string>
  projects: Project[]
}

export function NewTransactionSheet({ categories, currencies, settings, projects }: NewTransactionSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <AddTransactionMenu onAddTransaction={() => setOpen(true)} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
            <SheetTitle>New transaction</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TransactionCreateForm
              categories={categories}
              currencies={currencies}
              settings={settings}
              projects={projects}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

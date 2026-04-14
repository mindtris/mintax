"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Receipt, Pencil, FileText } from "lucide-react"
import { NewInvoiceSheet } from "@/components/invoices/new-invoice-sheet"
import { EditContactSheet } from "./edit-contact-sheet"

interface ContactDetailActionsProps {
  contactId: string
  currencies: Array<{ code: string; name: string }>
}

export function ContactDetailActions({
  contactId,
  currencies,
}: ContactDetailActionsProps) {
  const [isInvoiceSheetOpen, setIsInvoiceSheetOpen] = useState(false)
  const [isEstimateSheetOpen, setIsEstimateSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <NewInvoiceSheet
        defaultType="sales"
        open={isInvoiceSheetOpen}
        onOpenChange={setIsInvoiceSheetOpen}
        defaultContactId={contactId}
        currencies={currencies}
      >
        <Button variant="default" size="sm" className="h-8 text-xs font-semibold">
          <Receipt className="h-4 w-4 mr-1.5" /> New invoice
        </Button>
      </NewInvoiceSheet>

      <NewInvoiceSheet
        defaultType="estimate"
        open={isEstimateSheetOpen}
        onOpenChange={setIsEstimateSheetOpen}
        defaultContactId={contactId}
        currencies={currencies}
      >
        <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold">
          <FileText className="h-4 w-4 mr-1.5" /> Add estimate
        </Button>
      </NewInvoiceSheet>

      <Button variant="outline" size="sm" onClick={() => setIsEditSheetOpen(true)} className="h-8 text-xs font-semibold">
        <Pencil className="h-4 w-4 mr-1.5" /> Edit
      </Button>

      <EditContactSheet
        contactId={contactId}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        currencies={currencies}
      />
    </div>
  )
}

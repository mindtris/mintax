"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { User, Loader2 } from "lucide-react"
import { ContactForm } from "./contact-form"

interface EditContactSheetProps {
  contactId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currencies?: Array<{ code: string; name: string }>
}

export function EditContactSheet({
  contactId,
  open,
  onOpenChange,
  currencies = [],
}: EditContactSheetProps) {
  const [loading, setLoading] = useState(false)
  const [contact, setContact] = useState<any>(null)

  useEffect(() => {
    if (open && contactId) {
      fetchContact()
    } else if (!open) {
      setContact(null)
    }
  }, [open, contactId])

  async function fetchContact() {
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}`)
      if (res.ok) {
        const json = await res.json()
        setContact(json)
      }
    } catch (error) {
      console.error("Failed to fetch contact:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden border border-border shadow-2xl rounded-2xl"
      >
        <SheetHeader className="px-8 pt-8 pb-6 shrink-0 bg-muted/5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <User className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              {loading ? "Loading..." : contact ? `Edit ${contact.name}` : "Member Details"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Fetching member details...</p>
            </div>
          ) : contact ? (
            <ContactForm 
              mode="edit" 
              defaultValues={{
                ...contact,
                persons: contact.persons?.map((p: any) => ({
                  ...p,
                  id: p.id || crypto.randomUUID()
                }))
              }} 
              currencies={currencies}
              onSuccess={() => onOpenChange(false)}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Could not load contact data.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

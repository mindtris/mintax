import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ContactForm } from "./contact-form"

export function NewContactSheet({
  children,
  defaultType,
  currencies = [],
  open,
  onOpenChange,
}: {
  children?: React.ReactNode
  defaultType?: string
  currencies?: Array<{ code: string; name: string }>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children && (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      )}
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden border border-border shadow-2xl rounded-2xl"
      >
        <SheetHeader className="px-8 pt-8 pb-6 shrink-0 bg-muted/5 border-b border-border/50">
          <SheetTitle className="text-xl font-bold tracking-tight">New contact</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <ContactForm
            mode="create"
            defaultValues={{ type: (defaultType as "client" | "vendor" | "contractor" | "provider" | "partner") ?? "client" }}
            currencies={currencies}
            onSuccess={() => onOpenChange?.(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

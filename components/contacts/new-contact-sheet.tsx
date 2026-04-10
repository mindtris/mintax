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
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>New contact</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ContactForm
            mode="create"
            defaultValues={{ type: (defaultType as "client" | "vendor" | "contractor" | "provider" | "partner") ?? "client" }}
            currencies={currencies}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Bug } from "lucide-react"
import { BugReportForm } from "@/components/marketing/bug-report-form"

export function BugReportSheet({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bug className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <SheetTitle className="text-xl font-bold">Report a bug</SheetTitle>
              <SheetDescription className="text-muted-foreground text-sm">
                Help us improve Mintax. Tell us what went wrong.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <BugReportForm />
        </div>
      </SheetContent>
    </Sheet>
  )
}

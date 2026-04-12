"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus } from "lucide-react"
import { useState } from "react"
import { QuicklinkForm } from "./quicklink-form"

export function NewQuicklinkSheet({ categories = [] }: { categories?: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add link
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle>New quicklink</SheetTitle>
        </SheetHeader>
        
        <div className="px-6 py-6 flex-1 overflow-y-auto">
          <QuicklinkForm 
            categories={categories} 
            onSuccess={() => setOpen(false)} 
            onCancel={() => setOpen(false)} 
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

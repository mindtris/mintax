"use client"

import { ContactsGrid } from "./contacts-grid"
import { ContactSearchAndFilters } from "./filters"
import { NewContactSheet } from "./new-contact-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Upload, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function CustomersView({
  tab,
  data,
  total,
  currencies = [],
  countries = [],
  categories = [],
}: {
  tab: string,
  data: any[],
  total: number,
  currencies?: Array<{ code: string; name: string }>,
  countries?: string[],
  categories?: any[],
}) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const activeType = tab === "all" ? "all" : (tab.endsWith("s") ? tab.slice(0, -1) : tab) as any

  const clientCount = data.filter(c => c.type === "client").length
  const vendorCount = data.filter(c => c.type === "vendor").length
  const partnerCount = data.filter(c => c.type === "partner").length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Contacts</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-border/50 border shadow-sm">
            {total}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                <span className="hidden md:block">Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSheetOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Add contact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/import/csv")}>
                <Upload className="h-4 w-4" />
                Import contacts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <NewContactSheet
            defaultType={activeType !== "all" ? activeType : "client"}
            currencies={currencies}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Clients</div>
            <div className="text-2xl font-bold mt-1">{clientCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Vendors</div>
            <div className="text-2xl font-bold mt-1">{vendorCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-card-foreground">Partners</div>
            <div className="text-2xl font-bold mt-1">{partnerCount}</div>
          </CardContent>
        </Card>
      </div>

      <ContactSearchAndFilters countries={countries} categories={categories} />

      <ContactsGrid contacts={data} activeTab={tab} />
    </div>
  )
}

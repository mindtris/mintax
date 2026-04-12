"use client"

import { Check, Plus, ShipWheel } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createOrganizationAction } from "@/app/(app)/organizations/new/actions"

type OrgInfo = {
  id: string
  name: string
  slug: string
  type: string
  role: string
}

export function OrgSwitcher({
  activeOrg,
  organizations,
}: {
  activeOrg: OrgInfo
  organizations: OrgInfo[]
}) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createOrganizationAction, null)

  const handleSwitch = async (orgId: string) => {
    await fetch("/api/org/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    })
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 w-full rounded-md border px-3 h-8 text-sm hover:bg-accent transition-colors">
            <ShipWheel className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate flex-1 text-left font-medium">{activeOrg.name}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px]">
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org.id)}
              className="flex items-center gap-2"
            >
              <ShipWheel className="h-4 w-4 shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate text-sm font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{org.type} &middot; {org.role}</span>
              </div>
              {org.id === activeOrg.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSheetOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New organization</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
            <SheetTitle>New organization</SheetTitle>
          </SheetHeader>

          <form action={formAction} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Organization name</Label>
                <Input id="name" name="name" placeholder="e.g., Mindtris" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="business">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="baseCurrency">Base currency</Label>
                  <Select name="baseCurrency" defaultValue="INR">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="taxId">Tax ID (GSTIN / EIN)</Label>
                  <Input id="taxId" name="taxId" placeholder="Optional" />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" placeholder="Optional" />
                </div>
              </div>

              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </div>

            <div className="shrink-0 px-6 py-4 flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Creating..." : "Create organization"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}

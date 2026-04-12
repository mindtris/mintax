"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { inviteMemberAction } from "@/app/(app)/people/actions"

import { useRouter } from "next/navigation"
import { ORGANIZATION_ROLES } from "@/lib/constants/auth"

interface InviteMemberSheetProps {
  trigger?: React.ReactNode
}

export function InviteMemberSheet({ trigger }: InviteMemberSheetProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const role = formData.get("role") as string

    try {
      const res = await inviteMemberAction(email, role)

      if (!res.success) {
        throw new Error(res.error || "Failed to invite member")
      }

      toast.success("Member added successfully")
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Invite</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0 shadow-2xl overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle>Invite member</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="colleague@company.com"
                required
                className="h-11 border-black/[0.1] bg-background shadow-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter the email of the person you want to invite. They must have an account.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-semibold text-muted-foreground">Organization role</Label>
              <Select name="role" defaultValue="member">
                <SelectTrigger className="h-11 border-black/[0.1] bg-background shadow-sm">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0">
            <div className="flex gap-2 w-full">
              <Button type="submit" className="flex-1 h-11" disabled={loading}>
                {loading ? "Saving..." : "Send invitation"}
              </Button>
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

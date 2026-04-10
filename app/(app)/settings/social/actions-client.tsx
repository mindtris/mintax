"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Power, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { disableSocialAccountAction, deleteSocialAccountAction } from "./actions"

export function SocialAccountActions({ accountId, disabled }: { accountId: string; disabled: boolean }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={async () => { await disableSocialAccountAction(accountId, !disabled); router.refresh() }}>
          <Power className="h-4 w-4" />
          {disabled ? "Enable" : "Disable"}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={async () => { if (confirm("Delete this account?")) { await deleteSocialAccountAction(accountId); router.refresh() } }}>
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

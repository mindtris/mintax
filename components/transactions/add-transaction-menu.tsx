"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, Inbox, Plus } from "lucide-react"
import Link from "next/link"

interface AddTransactionMenuProps {
  onAddTransaction: () => void
}

export function AddTransactionMenu({ onAddTransaction }: AddTransactionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          <span className="hidden md:block">Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onAddTransaction} className="cursor-pointer">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Add transaction
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/unsorted">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            Bulk import receipts
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

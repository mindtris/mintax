"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Facebook, Instagram, Linkedin, Plus, Twitter } from "lucide-react"

const providers = [
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "twitter", label: "Twitter / X", icon: Twitter },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
]

export function ConnectAccountButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          <span className="hidden md:block">Connect</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {providers.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => window.location.href = `/api/social/callback/${p.id}?action=connect`}>
            <p.icon className="h-4 w-4" />
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

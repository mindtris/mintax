"use client"

import { cn } from "@/lib/utils"
import {
  Building2,
  Handshake,
  Package,
  Settings,
  Wrench,
} from "lucide-react"

export type ContactType =
  | "client"
  | "vendor"
  | "contractor"
  | "provider"
  | "partner"

const CONFIG: Record<
  ContactType,
  { label: string; icon: React.ElementType; className: string }
> = {
  client: {
    label: "Client",
    icon: Building2,
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  vendor: {
    label: "Vendor",
    icon: Package,
    className:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  },
  contractor: {
    label: "Contractor",
    icon: Wrench,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  provider: {
    label: "Provider",
    icon: Settings,
    className:
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
  },
  partner: {
    label: "Partner",
    icon: Handshake,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
}

interface ContactTypeBadgeProps {
  type: ContactType | string
  size?: "sm" | "md"
  className?: string
}

export function ContactTypeBadge({
  type,
  size = "sm",
  className,
}: ContactTypeBadgeProps) {
  const cfg = CONFIG[type as ContactType] ?? {
    label: type,
    icon: Building2,
    className: "bg-muted text-muted-foreground border-border",
  }
  const Icon = cfg.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        cfg.className,
        className
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {cfg.label}
    </span>
  )
}

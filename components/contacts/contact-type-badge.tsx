"use client"

import { cn } from "@/lib/utils"
import {
  Handshake,
  Settings,
  ShipWheel,
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
    icon: ShipWheel,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  vendor: {
    label: "Vendor",
    icon: ShipWheel,
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  contractor: {
    label: "Contractor",
    icon: Wrench,
    className: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  },
  provider: {
    label: "Provider",
    icon: Settings,
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
  partner: {
    label: "Partner",
    icon: Handshake,
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
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
    icon: ShipWheel,
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

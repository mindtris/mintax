"use client"

import { cn } from "@/lib/utils"
import {
  BadgeCent,
  BrainCircuit,
  CalendarClock,
  CreditCard,
  Database,
  FileText,
  FolderKanban,
  Landmark,
  ListChecks,
  Mail,
  Palette,
  Receipt,
  Settings,
  Share2,
  ShieldAlert,
  SquareStack,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  settings: Settings,
  user: User,
  landmark: Landmark,
  "brain-circuit": BrainCircuit,
  "calendar-clock": CalendarClock,
  receipt: Receipt,
  "square-stack": SquareStack,
  "file-text": FileText,
  "folder-kanban": FolderKanban,
  palette: Palette,
  "badge-cent": BadgeCent,
  mail: Mail,
  "list-checks": ListChecks,
  "credit-card": CreditCard,
  "share-2": Share2,
  database: Database,
  "shield-alert": ShieldAlert,
}

export interface NavGroup {
  label: string
  items: {
    href: string
    title: string
    icon: string
  }[]
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  groups: NavGroup[]
}

export function SideNav({ className, groups, ...props }: SidebarNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "business"

  const allItems = groups.flatMap((g) => g.items)

  const isItemActive = (href: string) => {
    const url = new URL(href, "http://x")
    const itemTab = url.searchParams.get("tab")
    return pathname === "/settings" && itemTab === activeTab
  }

  return (
    <>
      {/* Mobile: horizontal scrollable tabs */}
      <nav className={cn("flex lg:hidden overflow-x-auto gap-1 pb-2 scrollbar-none", className)} {...props}>
        {allItems.map((item) => {
          const isActive = isItemActive(item.href)
          const Icon = iconMap[item.icon] || Settings
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-all duration-150",
                isActive
                  ? "bg-foreground/10 text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-foreground" : "text-muted-foreground/70")} />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop: grouped vertical sidebar */}
      <nav className={cn("hidden lg:flex flex-col gap-6", className)} {...props}>
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1">
              {group.label}
            </span>
            {group.items.map((item) => {
              const isActive = isItemActive(item.href)
              const Icon = iconMap[item.icon] || Settings
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150",
                    isActive
                      ? "bg-foreground/10 text-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-foreground" : "text-muted-foreground/70")} />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </>
  )
}

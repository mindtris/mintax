"use client"

import { useNotification } from "@/app/(app)/context"
import { Button } from "@/components/ui/button"
import { UserProfile } from "@/lib/core/auth"
import config from "@/lib/core/config"
import {
  BadgeCent,
  BadgePercent,
  Blocks,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarOff,
  ChevronDown,
  ClockArrowUp,
  Contact,
  FileText,
  Handshake,
  Hash,
  HeartHandshake,
  House,
  Landmark,
  LayoutDashboard,
  Link as LinkIcon,
  LoaderPinwheel,
  LogOut,
  Mail,
  Menu,
  MessageCircleHeart,
  Newspaper,
  Package,
  PenTool,
  Plus,
  Receipt,
  ReceiptText,
  Repeat,
  Scale,
  Search,
  Settings,
  Share2,
  Target,
  TrendingUp,
  UserPlus,
  UserRound,
  UserRoundCog,
  UserRoundPen,
  UserRoundPlus,
  UserRoundSearch,
  Users,
  UsersRound,
  Wrench,
  X,
  CircleUserRound,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { OrgSwitcher } from "../sidebar/org-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type OrgInfo = {
  id: string
  name: string
  slug: string
  type: string
  role: string
}

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

type NavModule = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  basePaths: string[]
  items: NavItem[]
}

const modules: NavModule[] = [
  {
    key: "accounts",
    label: "Accounts",
    icon: BadgeCent,
    basePaths: ["/accounts", "/transactions", "/bills", "/bank-accounts", "/reconciliation", "/reports", "/unsorted", "/import"],
    items: [
      { href: "/accounts?tab=transactions", label: "Transactions", icon: FileText },
      { href: "/accounts?tab=bank-accounts", label: "Bank accounts", icon: Landmark },
      { href: "/accounts?tab=reconciliation", label: "Reconciliation", icon: Scale },
      { href: "/accounts?tab=bills", label: "Bills", icon: ClockArrowUp },
      { href: "/accounts?tab=reports", label: "Reports", icon: TrendingUp },
      { href: "/accounts?tab=unsorted", label: "Unsorted", icon: ClockArrowUp },
    ],
  },
  {
    key: "people",
    label: "People",
    icon: UserRound,
    basePaths: ["/people"],
    items: [
      { href: "/people?tab=directory", label: "Directory", icon: Users },
      { href: "/people?tab=reminders", label: "Reminders", icon: ClockArrowUp },
      { href: "/people?tab=time-off", label: "Time off", icon: CalendarOff },
      { href: "/people?tab=documents", label: "Documents", icon: FileText },
      { href: "/people?tab=quicklinks", label: "Quicklinks", icon: LinkIcon },
      { href: "/people?tab=onboarding", label: "Onboarding", icon: UserPlus },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    icon: BadgePercent,
    basePaths: ["/sales", "/invoices", "/estimates", "/customers"],
    items: [
      { href: "/sales?tab=leads", label: "Leads", icon: Target },
      { href: "/sales?tab=invoices", label: "Invoices", icon: Receipt },
      { href: "/sales?tab=estimates", label: "Estimates", icon: ReceiptText },
      { href: "/sales?tab=contacts", label: "Contacts", icon: UsersRound },
    ],
  },
  {
    key: "hire",
    label: "Hire",
    icon: LoaderPinwheel,
    basePaths: ["/hire"],
    items: [
      { href: "/hire?tab=jobs", label: "Jobs", icon: BriefcaseBusiness },
      { href: "/hire?tab=candidates", label: "Candidates", icon: UserRoundSearch },
      { href: "/hire?tab=pipeline", label: "Pipeline", icon: LayoutDashboard },
      { href: "/hire?tab=screening", label: "Screening", icon: Search },
      { href: "/hire?tab=offers", label: "Offers", icon: Handshake },
      { href: "/hire?tab=bench", label: "Bench", icon: ClockArrowUp },
    ],
  },
  {
    key: "engage",
    label: "Engage",
    icon: MessageCircleHeart,
    basePaths: ["/engage", "/apps/outlook"],
    items: [
      { href: "/engage?tab=posts", label: "Posts", icon: HeartHandshake },
      { href: "/engage?tab=calendar", label: "Calendar", icon: CalendarOff },
      { href: "/engage?tab=content", label: "Content", icon: FileText },
      { href: "/engage?tab=branding", label: "Branding", icon: Newspaper },
      { href: "/engage?tab=analytics", label: "Analytics", icon: TrendingUp },
    ],
  },
]

function getActiveModule(pathname: string, searchParams: URLSearchParams): NavModule | null {
  const tab = searchParams.get("tab")
  if (pathname === "/dashboard" || pathname === "/" || (pathname.startsWith("/apps") && !tab) || (pathname.startsWith("/apps") && tab !== "outlook")) return null
  
  // Special case for accounts landing page or any accounts-based tab
  if (pathname === "/accounts") {
    return modules.find(m => m.key === "accounts") || null
  }

  for (const mod of modules) {
    if (mod.basePaths.some((p) => pathname.startsWith(p)) || (tab === "outlook" && mod.key === "engage")) {
      return mod
    }
  }
  return null
}

export function TopNav({
  profile,
  unsortedFilesCount,
  activeOrg,
  organizations,
}: {
  profile: UserProfile
  unsortedFilesCount: number
  activeOrg: OrgInfo
  organizations: OrgInfo[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { notification } = useNotification()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeModule = getActiveModule(pathname, searchParams)

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      {/* Primary bar — module tabs + right actions */}
      <div className={`flex h-12 items-center px-4 gap-4 ${activeModule ? "border-b border-border" : ""}`}>
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 mr-2">
            <Image src="/logo/logo.svg" alt={config.app.title} width={24} height={24} />
          </Link>
        </div>

        {/* Module tabs — desktop */}
        <nav className="hidden lg:flex items-center gap-1.5 flex-1 min-w-0">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
              pathname === "/dashboard"
                ? "bg-foreground/10 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <House className="h-4 w-4" />
            <span>Home</span>
          </Link>
          {modules.map((mod) => {
            const isActive = activeModule && mod.key === activeModule.key
            const Icon = mod.icon
            return (
              <Link
                key={mod.key}
                href={mod.items[0].href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-foreground/10 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{mod.label}</span>
              </Link>
            )
          })}
          <Link
            href="/apps"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
              pathname.startsWith("/apps")
                ? "bg-foreground/10 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Blocks className="h-4 w-4" />
            <span>Apps</span>
          </Link>
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <div className="hidden lg:block">
            <OrgSwitcher activeOrg={activeOrg} organizations={organizations} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="hidden sm:flex h-8 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Create</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href="/accounts?tab=transactions" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Transaction
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/invoices/new" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Invoice
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/invoices/new?type=estimate" className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4" />
                  Estimate
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/invoices/new?type=recurring" className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Recurring invoice
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/invoices/new?type=bill" className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4" />
                  Bill
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/customers/clients" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Customer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/customers/vendors" className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4" />
                  Vendor
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/apps" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product or service
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/settings"
            className={cn(
              "hidden lg:flex items-center justify-center h-8 w-8 rounded-md transition-colors",
              pathname.startsWith("/settings")
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center rounded-full hover:opacity-80 transition-opacity">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <CircleUserRound className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 pb-2">
              <div className="px-3 py-2 flex flex-col gap-0.5 mb-1.5 opacity-90">
                <p className="text-sm font-semibold">{profile.name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <DropdownMenuItem asChild className="px-3 cursor-pointer">
                <Link href="/settings/profile" className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="px-3 cursor-pointer">
                <Link href="/settings/business" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Organization Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="px-3 cursor-pointer">
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Global Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="px-3 cursor-pointer">
                <Link href="/import/csv" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Import Tools</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="px-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 mt-1"
                onClick={async () => {
                  const { authClient } = await import("@/lib/core/auth-client")
                  await authClient.signOut({})
                  window.location.href = "/signin"
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Secondary bar — sub-navigation for active module */}
      {activeModule && (
      <div>
        <div className="flex h-10 items-center px-4 gap-1 overflow-x-auto scrollbar-none">
          {activeModule.items.map((item) => {
            // Handle items that use query params (e.g. /customers?type=client or /accounts?tab=transactions)
            const [itemPath, itemQuery] = item.href.split("?")
            const itemParams = new URLSearchParams(itemQuery ?? "")
            const itemType = itemParams.get("type")
            const itemTab = itemParams.get("tab")

            let isActive = false
            if (item.href === "/customers" && !itemType) {
              // "All" — active only when on /customers with no type or type=all
              isActive =
                pathname === "/customers" &&
                (!searchParams.get("type") || searchParams.get("type") === "all")
            } else if (itemType) {
              // typed sub-items — match by pathname + query param 'type'
              isActive =
                pathname === itemPath && searchParams.get("type") === itemType
            } else if (itemTab) {
              // tabbed sub-items — match by pathname + query param 'tab'
              isActive =
                pathname === itemPath && searchParams.get("tab") === itemTab
            } else {
              isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            }

            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-all duration-200",
                  isActive
                    ? "bg-foreground/10 text-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground/70")} />
                <span>{item.label}</span>
                {item.label === "Unsorted" && unsortedFilesCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unsortedFilesCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
      )}

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b bg-background px-4 py-3 space-y-4">
          <div>
            <OrgSwitcher activeOrg={activeOrg} organizations={organizations} />
          </div>

          {/* Module tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {modules.map((mod) => {
              const isActive = activeModule && mod.key === activeModule.key
              const Icon = mod.icon
              return (
                <Link
                  key={mod.key}
                  href={mod.items[0].href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-foreground/10 text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{mod.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Sub items for active module */}
          {activeModule && (
          <div className="space-y-0.5">
            {activeModule.items.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-foreground/10 text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.href === "/unsorted" && unsortedFilesCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {unsortedFilesCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          )}

          <div className="pt-1">
            <Link href="/accounts?tab=transactions" className="sm:hidden">
              <Button className="w-full h-9 text-sm">
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

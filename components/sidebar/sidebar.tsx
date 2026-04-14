"use client"

import { useNotification } from "@/app/(app)/context"
import { UploadButton } from "@/components/files/upload-button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserProfile } from "@/lib/core/auth"
import config from "@/lib/core/config"
import {
  Banknote,
  ShipWheel,
  ChevronRight,
  ClockArrowUp,
  FileText,
  House,
  Import,
  Landmark,
  LayoutDashboard,
  Mail,
  Receipt,
  Scale,
  Settings,
  TrendingUp,
  Upload,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { ColoredText } from "../ui/colored-text"
import { Blinker } from "./blinker"
import { SidebarMenuItemWithHighlight } from "./sidebar-item"
import SidebarUser from "./sidebar-user"
import { OrgSwitcher } from "./org-switcher"

type OrgInfo = {
  id: string
  name: string
  slug: string
  type: string
  role: string
}

const CONTACT_TYPES = [
  { label: "All", href: "/customers", param: "all" },
  { label: "Clients", href: "/customers?type=client", param: "client" },
  { label: "Vendors", href: "/customers?type=vendor", param: "vendor" },
  { label: "Contractors", href: "/customers?type=contractor", param: "contractor" },
  { label: "Providers", href: "/customers?type=provider", param: "provider" },
  { label: "Partners", href: "/customers?type=partner", param: "partner" },
]

export function AppSidebar({
  profile,
  unsortedFilesCount,
  isSelfHosted,
  activeOrg,
  organizations,
}: {
  profile: UserProfile
  unsortedFilesCount: number
  isSelfHosted: boolean
  activeOrg: OrgInfo
  organizations: OrgInfo[]
}) {
  const { open, setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { notification } = useNotification()

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  const isCustomersActive = pathname.startsWith("/customers")
  const activeType = searchParams.get("type") ?? "all"

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/logo.svg" alt="Logo" className="h-8 w-8" width={32} height={32} />
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-lg">
                <ColoredText>{config.app.title}</ColoredText>
              </span>
            </div>
          </Link>
          {open && (
            <OrgSwitcher activeOrg={activeOrg} organizations={organizations} />
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <UploadButton className="w-full mt-4 mb-2">
              <Upload className="h-4 w-4" />
              {open ? <span>Upload</span> : ""}
            </UploadButton>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItemWithHighlight href="/dashboard">
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                      <House />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/transactions">
                  <SidebarMenuButton asChild>
                    <Link href="/transactions">
                      <FileText />
                      <span>Transactions</span>
                      {notification &&
                        notification.code === "sidebar.transactions" &&
                        notification.message && <Blinker />}
                      <span></span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/invoices">
                  <SidebarMenuButton asChild>
                    <Link href="/invoices">
                      <Receipt />
                      <span>Invoices</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                {/* ── Contacts (collapsible) ── */}
                <Collapsible
                  asChild
                  defaultOpen={isCustomersActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={isCustomersActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "font-medium"}
                        tooltip="Contacts"
                      >
                        <ShipWheel />
                        <span>Contacts</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {CONTACT_TYPES.map((item) => {
                          const isActive =
                            isCustomersActive &&
                            (item.param === "all"
                              ? !searchParams.get("type") || activeType === "all"
                              : activeType === item.param)

                          return (
                            <SidebarMenuSubItem key={item.param}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive}
                              >
                                <Link href={item.href}>{item.label}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <SidebarMenuItemWithHighlight href="/bank-accounts">
                  <SidebarMenuButton asChild>
                    <Link href="/bank-accounts">
                      <Landmark />
                      <span>Bank Accounts</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/reconciliation">
                  <SidebarMenuButton asChild>
                    <Link href="/reconciliation">
                      <Scale />
                      <span>Reconciliation</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/reports">
                  <SidebarMenuButton asChild>
                    <Link href="/reports">
                      <TrendingUp />
                      <span>Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/unsorted">
                  <SidebarMenuButton asChild>
                    <Link href="/unsorted">
                      <ClockArrowUp />
                      <span>Unsorted</span>
                      {unsortedFilesCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {unsortedFilesCount}
                        </span>
                      )}
                      {notification &&
                        notification.code === "sidebar.unsorted" &&
                        notification.message && <Blinker />}
                      <span></span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/apps">
                  <SidebarMenuButton asChild>
                    <Link href="/apps">
                      <LayoutDashboard />
                      <span>Apps</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/settings">
                  <SidebarMenuButton asChild>
                    <Link href="/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />

        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/import/csv">
                      <Import />
                      Import from CSV
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {!open && (
                  <SidebarMenuItem>
                    <SidebarTrigger />
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarUser profile={profile} isSelfHosted={isSelfHosted} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}

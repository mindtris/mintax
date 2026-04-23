import { SideNav, NavGroup } from "@/components/settings/side-nav"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Customize your settings here",
}

const settingsGroups: NavGroup[] = [
  {
    label: "Account",
    items: [
      { title: "Profile", href: "/settings?tab=profile", icon: "user" },
      { title: "Business details", href: "/settings?tab=business", icon: "landmark" },
    ],
  },
  {
    label: "AI & Automation",
    items: [
      { title: "LLM settings", href: "/settings?tab=llm", icon: "brain-circuit" },
      { title: "Schedules", href: "/settings?tab=schedule", icon: "calendar-clock" },
      { title: "Categorization rules", href: "/settings?tab=rules", icon: "list-checks" },
    ],
  },
  {
    label: "Financial",
    items: [
      { title: "Templates", href: "/settings?tab=templates", icon: "layout-template" },
      { title: "Invoices", href: "/settings?tab=invoice", icon: "file-text" },
      { title: "Estimates", href: "/settings?tab=estimate", icon: "quote" },
      { title: "Taxes", href: "/settings?tab=taxes", icon: "receipt" },
      { title: "Items", href: "/settings?tab=items", icon: "square-stack" },
      { title: "Categories", href: "/settings?tab=categories", icon: "folder-kanban" },
      { title: "Projects", href: "/settings?tab=projects", icon: "palette" },
      { title: "Currencies", href: "/settings?tab=currencies", icon: "badge-cent" },
    ],
  },
  {
    label: "Communications",
    items: [
      { title: "Social accounts", href: "/settings?tab=social", icon: "share-2" },
      { title: "Calendar", href: "/settings?tab=calendar", icon: "calendar-days" },
    ],
  },
  {
    label: "Advanced",
    items: [
      { title: "Fields", href: "/settings?tab=fields", icon: "list-checks" },
      { title: "Payables", href: "/settings?tab=payables", icon: "credit-card" },
      { title: "Public API", href: "/settings?tab=public-api", icon: "plug" },
      { title: "Backups", href: "/settings?tab=backups", icon: "database" },
      { title: "Danger zone", href: "/settings?tab=danger", icon: "shield-alert" },
    ],
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Settings</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-24">
            <SideNav groups={settingsGroups} />
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

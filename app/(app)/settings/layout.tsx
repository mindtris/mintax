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
      { title: "General", href: "/settings", icon: "settings" },
      { title: "Profile & plan", href: "/settings/profile", icon: "user" },
      { title: "Business details", href: "/settings/business", icon: "landmark" },
    ],
  },
  {
    label: "AI & Automation",
    items: [
      { title: "LLM settings", href: "/settings/llm", icon: "brain-circuit" },
    ],
  },
  {
    label: "Financial",
    items: [
      { title: "Taxes", href: "/settings/taxes", icon: "receipt" },
      { title: "Items", href: "/settings/items", icon: "square-stack" },
      { title: "Categories", href: "/settings/categories", icon: "folder-kanban" },
      { title: "Projects", href: "/settings/projects", icon: "palette" },
      { title: "Currencies", href: "/settings/currencies", icon: "badge-cent" },
    ],
  },
  {
    label: "Integrations",
    items: [
      { title: "Social accounts", href: "/settings/social", icon: "share-2" },
    ],
  },
  {
    label: "Advanced",
    items: [
      { title: "Fields", href: "/settings/fields", icon: "list-checks" },
      { title: "Payables", href: "/settings/payables", icon: "credit-card" },
      { title: "Backups", href: "/settings/backups", icon: "database" },
      { title: "Danger zone", href: "/settings/danger", icon: "shield-alert" },
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

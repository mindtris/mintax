import { getApps } from "./common"
import { OutlookApp } from "@/components/apps/outlook-app"
import { icons } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const apps = await getApps()

  // Redirect reminders to people tab
  if (tab === "reminders") {
    redirect("/people?tab=reminders")
  }

  // Render specific app tabs
  if (tab === "outlook") {
    return <OutlookApp />
  }


  // Default: app gallery
  const filteredApps = apps.filter((app) => app.id !== "reminders")

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Apps</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {filteredApps.length}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
        {filteredApps.map((app) => {
          const LucideIcon = icons[app.manifest.icon as keyof typeof icons]

          return (
            <Link
              key={app.id}
              href={`/apps?tab=${app.id}`}
              className="group border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                {LucideIcon && <LucideIcon className="h-5 w-5 text-white" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {app.manifest.name}
                </h3>
                <p className="text-xs text-[#141413] mt-0.5 line-clamp-1">
                  {app.manifest.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

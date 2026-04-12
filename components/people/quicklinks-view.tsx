import { NewQuicklinkSheet } from "@/components/quicklinks/new-quicklink-sheet"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getQuicklinks } from "@/lib/services/quicklinks"
import { getCategoriesByType } from "@/lib/services/categories"
import { QuicklinksList } from "./quicklinks-list"

export async function QuicklinksView() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const links = await getQuicklinks(org.id)
  const categories = await getCategoriesByType(org.id, "quicklink")

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Quicklinks</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {links.length}
          </div>
        </div>
        <NewQuicklinkSheet categories={categories} />
      </header>

      <QuicklinksList links={links} categories={categories} />
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getOrgMembers } from "@/lib/services/organizations"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import { DirectoryList } from "./directory-list"

export async function DirectoryView() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const members = await getOrgMembers(org.id)

  const rows = members.map((m) => ({
    id: m.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    initial: m.user.name.charAt(0).toUpperCase(),
  }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Directory</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {members.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button>
              <UserPlus className="h-4 w-4" />
              <span className="hidden md:block">Invite</span>
            </Button>
          </Link>
        </div>
      </header>

      <DirectoryList members={rows} />
    </div>
  )
}

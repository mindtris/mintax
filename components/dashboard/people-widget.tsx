import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getOrgMembers } from "@/lib/services/organizations"
import { prisma } from "@/lib/core/db"
import { Crown, Plus, Shield, UserPlus, Users } from "lucide-react"
import Link from "next/link"

const CARD = "border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden"

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  accountant: "secondary",
  member: "outline",
  viewer: "outline",
}

export async function PeopleWidget() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const members = await getOrgMembers(org.id)

  const ownerCount = members.filter((m) => m.role === "owner").length
  const adminCount = members.filter((m) => m.role === "admin").length
  const memberCount = members.filter((m) => m.role !== "owner" && m.role !== "admin").length

  // Recent activity — last 5 transactions created by team members
  const recentActivity = await prisma.transaction.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      userId: true,
      type: true,
      total: true,
      currencyCode: true,
      createdAt: true,
    },
  })

  // Map user IDs to names
  const userMap = new Map(members.map((m) => [m.userId, m.user]))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">People</h2>
          <p className="text-sm text-muted-foreground">Team members and activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Users className="h-3.5 w-3.5" />
              Manage
            </Button>
          </Link>
          <Link href="/settings">
            <Button size="sm">
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold mt-1">{members.length}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Owners</span>
            </div>
            <div className="text-2xl font-bold mt-1">{ownerCount}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <div className="text-2xl font-bold mt-1">{adminCount}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Members</span>
            </div>
            <div className="text-2xl font-bold mt-1">{memberCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Directory + Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={CARD}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Team Directory</CardTitle>
              <Link href="/settings" className="text-xs text-primary hover:underline">Settings</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 -mx-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{member.user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.user.email}</div>
                    </div>
                  </div>
                  <Badge variant={roleBadgeVariant[member.role] || "outline"} className="text-[10px] capitalize shrink-0">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={CARD}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((tx) => {
                  const actorName = userMap.get(tx.userId)?.name || "Unknown"
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-2 -mx-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="text-sm truncate">{tx.name || "Transaction"}</div>
                        <div className="text-xs text-muted-foreground">
                          {actorName} · <span className="capitalize">{tx.type}</span>
                        </div>
                      </div>
                      {tx.total && (
                        <span className="text-sm font-medium shrink-0">
                          {((tx.total || 0) / 100).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

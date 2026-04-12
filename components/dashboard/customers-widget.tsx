import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { listContacts } from "@/lib/services/contacts"
import { prisma } from "@/lib/core/db"
import { Building2, HandCoins, Plus, Users, UsersRound } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

const CARD = "border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden"

export async function CustomersWidget() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const [clientCount, vendorCount, totalCount, recentContacts, topClients] = await Promise.all([
    prisma.contact.count({ where: { organizationId: org.id, type: "client", isActive: true, deletedAt: null } }),
    prisma.contact.count({ where: { organizationId: org.id, type: "vendor", isActive: true, deletedAt: null } }),
    prisma.contact.count({ where: { organizationId: org.id, isActive: true, deletedAt: null } }),
    prisma.contact.findMany({
      where: { organizationId: org.id, isActive: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.contact.findMany({
      where: { organizationId: org.id, type: "client", isActive: true, deletedAt: null },
      include: {
        _count: { select: { invoices: true, transactions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const outstandingResult = await prisma.invoice.aggregate({
    where: {
      organizationId: org.id,
      status: { in: ["sent", "overdue"] },
    },
    _sum: { total: true },
  })
  const outstanding = outstandingResult._sum.total || 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Customers</h2>
          <p className="text-sm text-muted-foreground">Clients, vendors, and contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/customers">
            <Button variant="outline" size="sm">
              <Users className="h-3.5 w-3.5" />
              View All
            </Button>
          </Link>
          <Link href="/customers?action=new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add Contact
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
            <div className="text-2xl font-bold mt-1">{totalCount}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clients</span>
            </div>
            <div className="text-2xl font-bold mt-1">{clientCount}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Vendors</span>
            </div>
            <div className="text-2xl font-bold mt-1">{vendorCount}</div>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Outstanding</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(outstanding, org.baseCurrency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent + Top Clients */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={CARD}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Contacts</CardTitle>
              <Link href="/customers" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentContacts.length > 0 ? (
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <Link key={contact.id} href={`/customers/${contact.id}`} className="flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{contact.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{contact.email || "No email"}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{contact.type}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No contacts yet</p>
            )}
          </CardContent>
        </Card>

        <Card className={CARD}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Top Clients</CardTitle>
              <Link href="/customers?type=client" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {topClients.length > 0 ? (
              <div className="space-y-3">
                {topClients.map((client) => (
                  <Link key={client.id} href={`/customers/${client.id}`} className="flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client._count.invoices} invoices · {client._count.transactions} transactions</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No clients yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

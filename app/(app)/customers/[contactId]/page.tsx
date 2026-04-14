import { ContactStatsCards } from "@/components/contacts/contact-stats-cards"
import { ContactTypeBadge } from "@/components/contacts/contact-type-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getContact, getContactStats } from "@/lib/services/contacts"
import {
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  Settings2,
  ShieldCheck,
  ShipWheel,
  User,
} from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ContactDetailActions } from "@/components/contacts/contact-detail-actions"
import { getCurrencies } from "@/lib/services/currencies"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type Params = { params: Promise<{ contactId: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { contactId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const contact = await getContact(org.id, contactId)
  return { title: contact?.name ?? "Contact" }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted/50 text-muted-foreground border-border/50",
  sent: "bg-secondary/40 text-secondary-foreground border-secondary/20",
  paid: "bg-primary/10 text-primary border-primary/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground/50 border-border/50 line-through opacity-60",
}

export default async function ContactDetailPage({ params }: Params) {
  const { contactId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const [contact, stats, currencies] = await Promise.all([
    getContact(org.id, contactId),
    getContactStats(org.id, contactId),
    getCurrencies(org.id),
  ])

  if (!contact) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* ── Header ── */}
      <header className="flex items-start gap-4 flex-wrap">
        <Avatar className="h-14 w-14 shrink-0">
          {contact.avatar && (
            <AvatarImage src={contact.avatar} alt={contact.name} />
          )}
          <AvatarFallback className="text-lg font-bold bg-muted">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{contact.name}</h1>
            <ContactTypeBadge type={contact.type} size="md" />
            {!contact.isActive && (
              <span className="text-xs border rounded-full px-2 py-0.5 text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap text-sm text-muted-foreground">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5" /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Phone className="h-3.5 w-3.5" /> {contact.phone}
              </a>
            )}
            {contact.website && (
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe className="h-3.5 w-3.5" /> {contact.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <ContactDetailActions
          contactId={contact.id}
          currencies={currencies}
        />
      </header>

      {/* ── Stats ── */}
      <ContactStatsCards stats={stats} currency={contact.currency} />

      {/* ── Tabs Content ── */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="bg-muted/50 p-1 h-11 mb-6">
          <TabsTrigger value="invoices" className="px-6 h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Receipt className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="estimates" className="px-6 h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4 mr-2" />
            Estimates
          </TabsTrigger>
          <TabsTrigger value="details" className="px-6 h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <MapPin className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-0 focus-visible:ring-0">
          <div className="rounded-2xl border bg-card p-6 shadow-sm shadow-black/[0.02]">
            <h2 className="text-sm font-bold text-foreground mb-4">Invoice History</h2>
            {contact.invoices.filter(i => i.type !== 'estimate').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Receipt className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No invoices recorded yet</p>
              </div>
            ) : (
              <TransactionTable items={contact.invoices.filter(i => i.type !== 'estimate')} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="estimates" className="mt-0 focus-visible:ring-0">
          <div className="rounded-2xl border bg-card p-6 shadow-sm shadow-black/[0.02]">
            <h2 className="text-sm font-bold text-foreground mb-4">Active Estimates</h2>
            {contact.invoices.filter(i => i.type === 'estimate').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No estimates created yet</p>
              </div>
            ) : (
              <TransactionTable items={contact.invoices.filter(i => i.type === 'estimate')} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-0 focus-visible:ring-0">
          <div className="flex flex-col gap-6">
            {/* Payment History - Full Width */}
            <div className="rounded-2xl border bg-card p-6 flex flex-col gap-4 shadow-sm shadow-black/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-foreground">Payment History</h2>
                  </div>
                </div>
                {contact.transactions.length > 0 && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] px-2 py-0 border-transparent">
                    LATEST {contact.transactions.length}
                  </Badge>
                )}
              </div>
              <Separator className="-mx-6 opacity-50" />
              
              {contact.transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center gap-2 opacity-50 py-12">
                  <CreditCard className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No payment records found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-0 border rounded-xl overflow-hidden">
                  {contact.transactions.map((t, idx) => (
                    <div key={t.id} className={cn(
                      "flex items-center justify-between p-4 hover:bg-muted/30 transition-colors",
                      idx !== contact.transactions.length - 1 && "border-b"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                          t.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                        )}>
                          {t.type === 'income' ? "+" : "-"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground capitalize">
                            {t.paymentMethod?.replace(/_/g, ' ') || "Payment"}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatDate(t.issuedAt || t.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {t.total !== null && (
                          <span className={cn(
                            "text-sm font-bold tabular-nums",
                            t.type === 'income' ? "text-emerald-600" : "text-foreground"
                          )}>
                            {t.type === 'income' ? "+" : "-"}{formatCurrency(t.total, t.currencyCode || "INR")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* People & Team */}
              <div className="rounded-2xl border bg-card p-6 flex flex-col gap-4 shadow-sm shadow-black/[0.02]">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-foreground">Points of Contact</h2>
                    <p className="text-[11px] text-muted-foreground">Team members and key stakeholders</p>
                  </div>
                </div>
                <Separator className="opacity-50" />
                {contact.persons.length === 0 ? (
                  <div className="text-center py-10 rounded-xl border-dashed border-2 flex flex-col items-center gap-2 opacity-40">
                    <User className="h-6 w-6" />
                    <p className="text-xs">No secondary contacts listed</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {contact.persons.map((p) => (
                      <div key={p.id} className="p-4 rounded-2xl bg-muted/20 border border-border/50 group hover:border-primary/30 transition-all hover:shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm text-foreground">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/50 px-1.5 rounded w-fit">
                              {p.role || "Contact"}
                            </span>
                          </div>
                          {p.isPrimary && (
                            <Badge className="bg-primary text-primary-foreground text-[9px] font-black h-4 px-1.5 uppercase tracking-tighter">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 pt-2 border-t border-border/40 text-[11px]">
                          {p.email && (
                            <a href={`mailto:${p.email}`} className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
                              <Mail className="h-3 w-3" /> {p.email}
                            </a>
                          )}
                          {p.phone && (
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" /> {p.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div className="rounded-2xl border bg-card p-6 flex flex-col gap-4 shadow-sm shadow-black/[0.02]">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Internal Notes</h2>
                </div>
                <Separator className="opacity-50" />
                {contact.notes ? (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex-1">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {contact.notes}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground/40 italic text-xs">
                    No active notes for this customer.
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TransactionTable({ items }: { items: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground border-b border-border/50">
          <th className="text-left font-semibold pb-3 text-xs uppercase tracking-wider">Document</th>
          <th className="text-left font-semibold pb-3 hidden sm:table-cell text-xs uppercase tracking-wider">Date</th>
          <th className="text-right font-semibold pb-3 text-xs uppercase tracking-wider">Amount</th>
          <th className="text-center font-semibold pb-3 text-xs uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody>
        {items.map((inv) => (
          <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
            <td className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                  <ShipWheel className="h-3.5 w-3.5 text-primary" />
                </div>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-bold text-foreground hover:text-primary transition-colors"
                >
                  {inv.invoiceNumber}
                </Link>
              </div>
            </td>
            <td className="py-4 text-muted-foreground hidden sm:table-cell tabular-nums text-xs">
              {formatDate(inv.issuedAt)}
            </td>
            <td className="py-4 text-right font-bold tabular-nums text-foreground/80 text-xs">
              {formatCurrency(inv.total, inv.currency)}
            </td>
            <td className="py-4 text-center">
              <span
                className={cn(
                  "inline-flex border rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  STATUS_COLOR[inv.status] ?? "bg-muted text-muted-foreground"
                )}
              >
                {inv.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground shrink-0 w-24">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

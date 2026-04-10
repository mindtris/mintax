import { ContactStatsCards } from "@/components/contacts/contact-stats-cards"
import { ContactTypeBadge } from "@/components/contacts/contact-type-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getContact, getContactStats } from "@/lib/services/contacts"
import {
  Building2,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
} from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

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
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground line-through",
}

export default async function ContactDetailPage({ params }: Params) {
  const { contactId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const [contact, stats] = await Promise.all([
    getContact(org.id, contactId),
    getContactStats(org.id, contactId),
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

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/invoices">
              <Receipt className="h-4 w-4" /> New invoice
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/customers/${contact.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
      </header>

      {/* ── Stats ── */}
      <ContactStatsCards stats={stats} currency={contact.currency} />

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Info + Contact Persons */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Profile Info */}
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Details</h2>
            <Separator />
            <dl className="flex flex-col gap-2 text-sm">
              {contact.taxId && (
                <Row label="Tax ID" value={contact.taxId} />
              )}
              {contact.currency && (
                <Row label="Currency" value={contact.currency} />
              )}
              {contact.reference && (
                <Row label="Reference" value={contact.reference} />
              )}
              {(contact.address || contact.city || contact.country) && (
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="text-muted-foreground">
                    {[
                      contact.address,
                      contact.city,
                      contact.state,
                      contact.zipCode,
                      contact.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              )}
              <Row label="Added" value={formatDate(contact.createdAt)} />
            </dl>
          </div>

          {/* Contact persons */}
          {contact.persons.length > 0 && (
            <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
              <h2 className="text-sm font-semibold">Contact persons</h2>
              <Separator />
              <ul className="flex flex-col gap-3">
                {contact.persons.map((p) => (
                  <li key={p.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{p.name}</span>
                      {p.isPrimary && (
                        <span className="text-xs text-emerald-600 font-semibold">
                          Primary
                        </span>
                      )}
                      {p.role && (
                        <span className="text-xs text-muted-foreground capitalize">
                          · {p.role}
                        </span>
                      )}
                    </div>
                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" /> {p.email}
                      </a>
                    )}
                    {p.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {p.phone}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
              <h2 className="text-sm font-semibold">Notes</h2>
              <Separator />
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {contact.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right: Invoices */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Invoices</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/invoices">
                  <FileText className="h-3.5 w-3.5" /> New invoice
                </Link>
              </Button>
            </div>
            <Separator />

            {contact.invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No invoices yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left font-medium pb-2">Invoice</th>
                    <th className="text-left font-medium pb-2 hidden sm:table-cell">Date</th>
                    <th className="text-right font-medium pb-2">Amount</th>
                    <th className="text-center font-medium pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contact.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 text-muted-foreground hidden sm:table-cell">
                        {formatDate(inv.issuedAt)}
                      </td>
                      <td className="py-2.5 text-right font-medium tabular-nums">
                        {formatCurrency(inv.total, inv.currency)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={[
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            STATUS_COLOR[inv.status] ?? "bg-muted text-muted-foreground",
                          ].join(" ")}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
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

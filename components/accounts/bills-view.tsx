import { NewBillSheet } from "@/components/bills/new-bill-sheet"
import { BillTable } from "@/components/bills/bill-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getBills, getBillStats, BillFilters } from "@/lib/services/bills"
import { getItems } from "@/lib/services/items"
import { getTaxes } from "@/lib/services/taxes"
import { Plus } from "lucide-react"

function formatAmount(amount: number, currency: string) {
  return (amount / 100).toLocaleString("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
}

export async function BillsView({ searchParams }: { searchParams?: BillFilters }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const [bills, items, taxes] = await Promise.all([
    getBills(org.id, searchParams),
    getItems(org.id),
    getTaxes(org.id),
  ])
  const stats = await getBillStats(org.id).catch(() => ({
    outstanding: { total: 0, count: 0 },
    overdue: { total: 0, count: 0 },
    paid: { total: 0, count: 0 },
  }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Bills</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {bills.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NewBillSheet baseCurrency={org.baseCurrency} items={items} taxes={taxes}>
            <Button className="text-white">
              <Plus className="h-4 w-4" />
              <span>Record bill</span>
            </Button>
          </NewBillSheet>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-[#141413]">Total payable</div>
            <div className="text-2xl font-bold mt-1 font-mono">
              {formatAmount(stats.outstanding.total, org.baseCurrency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-destructive">Overdue</div>
            <div className="text-2xl font-bold text-destructive mt-1 font-mono">
              {formatAmount(stats.overdue.total, org.baseCurrency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500">Settled</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1 font-mono">
              {formatAmount(stats.paid.total, org.baseCurrency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <BillTable bills={bills} baseCurrency={org.baseCurrency} />
    </div>
  )
}


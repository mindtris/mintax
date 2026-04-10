import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getRecurringTransactions } from "@/lib/services/recurring-transactions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { Plus, Repeat, Calendar } from "lucide-react"
import { NewRecurringSheet } from "./new-recurring-sheet"

export const metadata = {
  title: "Recurring transactions",
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
}

export default async function RecurringTransactionsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const recurring = await getRecurringTransactions(org.id)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Recurring transactions</h1>
          <span className="text-2xl tracking-tight text-muted-foreground">{recurring.length}</span>
        </div>
        <NewRecurringSheet baseCurrency={org.baseCurrency}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New recurring
          </Button>
        </NewRecurringSheet>
      </header>

      {recurring.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Repeat className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">No recurring transactions</h3>
              <p className="text-muted-foreground mt-1">
                Set up recurring entries for rent, subscriptions, salaries, etc.
              </p>
            </div>
            <NewRecurringSheet baseCurrency={org.baseCurrency}>
              <Button><Plus className="h-4 w-4 mr-2" /> Create recurring</Button>
            </NewRecurringSheet>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {recurring.map((rt: any) => (
            <Card key={rt.id} className={rt.isActive ? "" : "opacity-50"}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Repeat className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{rt.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">{rt.merchant || "No merchant"}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {RECURRENCE_LABELS[rt.recurrence] || rt.recurrence}
                      </Badge>
                      {!rt.isActive && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {rt.type === "income" ? "+" : "-"}
                      {rt.currencyCode} {((rt.total || 0) / 100).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Next: {format(new Date(rt.nextRunAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

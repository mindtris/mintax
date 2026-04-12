import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getBankAccountById, getBankStatements } from "@/lib/services/bank-accounts"
import { getTransactions } from "@/lib/services/transactions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building, CreditCard, Landmark } from "lucide-react"
import { notFound } from "next/navigation"
import { CSVImportButton } from "./csv-import"
import Link from "next/link"
import { format } from "date-fns"

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit card",
  cash: "Cash",
  wallet: "Wallet",
}

function formatAmount(amount: number, currency: string) {
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
}

export default async function BankAccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const account = await getBankAccountById(accountId, org.id)

  if (!account) notFound()

  const statements = await getBankStatements(accountId).catch(() => [])
  const { transactions } = await getTransactions(org.id, { bankAccountId: accountId } as any)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <Link href="/bank-accounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
          <p className="text-sm text-muted-foreground">
            {account.bankName && `${account.bankName} · `}
            {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}
            {account.accountNumber && ` · ****${account.accountNumber.slice(-4)}`}
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant="outline" className="text-lg font-bold px-4 py-2">
            {formatAmount(account.currentBalance, account.currency)}
          </Badge>
        </div>
      </header>

      {/* Account details card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Bank name</div>
                <div className="font-medium">{account.bankName || "Not specified"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Account number</div>
                <div className="font-medium">{account.accountNumber || "Not specified"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">IFSC code</div>
                <div className="font-medium">{account.ifscCode || "Not specified"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank statements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Bank statements</CardTitle>
          <CSVImportButton accountId={accountId} />
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No bank statements imported yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {statements.map((stmt: any) => (
                <div key={stmt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="text-sm font-medium">
                      {format(new Date(stmt.periodStart), "MMM d, yyyy")} — {format(new Date(stmt.periodEnd), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Imported {format(new Date(stmt.importedAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <Badge variant="secondary">{stmt._count?.entries || 0} entries</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent transactions</CardTitle>
          <Link href={`/accounts?tab=transactions&bankAccountId=${accountId}`}>
            <Button variant="outline" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No transactions linked to this account.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {transactions.slice(0, 20).map((txn: any) => (
                <Link
                  key={txn.id}
                  href={`/transactions/${txn.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium">{txn.name || txn.merchant || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground">
                      {txn.issuedAt ? format(new Date(txn.issuedAt), "MMM d, yyyy") : "No date"}
                      {txn.category && ` · ${txn.category.name}`}
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${txn.type === "income" ? "text-green-600" : ""}`}>
                    {txn.type === "income" ? "+" : "-"}
                    {formatAmount(Math.abs(txn.total || 0), txn.currencyCode || account.currency)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

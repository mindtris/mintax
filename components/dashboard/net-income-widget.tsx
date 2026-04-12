"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { FiscalYearComparison } from "@/lib/services/reporting"

interface NetIncomeWidgetProps {
  data: FiscalYearComparison
}

export function NetIncomeWidget({ data }: NetIncomeWidgetProps) {
  const rows = [
    { label: "Income", prev: data.previous.income, curr: data.current.income },
    { label: "Expense", prev: data.previous.expense, curr: data.current.expense },
    { label: "Net Income", prev: data.previous.net, curr: data.current.net, isBold: true },
  ]

  return (
    <Card className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm shadow-black/[0.02] overflow-hidden h-full flex flex-col">
      <CardHeader className="px-6 py-4 border-b border-border/50">
        <CardTitle className="text-sm font-medium">Net income comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 font-medium text-muted-foreground w-1/3">Type</th>
                <th className="text-right py-2 font-medium text-muted-foreground w-1/3">{data.previous.label}</th>
                <th className="text-right py-2 font-medium text-muted-foreground w-1/3 text-primary">{data.current.label}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.02]">
              {rows.map((row) => (
                <tr key={row.label} className={row.isBold ? "font-semibold" : ""}>
                  <td className="py-3 text-muted-foreground">{row.label}</td>
                  <td className="py-3 text-right">
                    {formatCurrency(row.prev, "INR")}
                  </td>
                  <td
                    className="py-3 text-right"
                    style={row.isBold ? { color: row.curr >= 0 ? "var(--chart-1)" : "var(--chart-5)" } : {}}
                  >
                    {formatCurrency(row.curr, "INR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
          <span className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground italic">
            Based on organization fiscal year settings
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

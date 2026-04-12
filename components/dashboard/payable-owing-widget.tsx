"use client"

import { AgingReport } from "@/lib/services/reporting"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PayableOwingWidgetProps {
  stats: AgingReport
  baseCurrency: string
}

export function PayableOwingWidget({ stats, baseCurrency }: PayableOwingWidgetProps) {
  return (
    <Card className="border border-border/50 shadow-sm shadow-black/[0.02] bg-card text-card-foreground rounded-2xl overflow-hidden h-full flex flex-col">
      <CardHeader className="px-6 py-4 border-b border-border/50">
        <CardTitle className="text-sm font-medium">Payable & owing</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-[280px]">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/[0.03] flex-1">
          {/* Receivables Column */}
          <div className="flex flex-col">
            <div className="px-6 py-3 bg-muted/30 border-b border-border/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoices payable to you</span>
            </div>
            <div className="flex flex-col">
              {stats.receivables.map((cat, i) => (
                <div
                  key={cat.label}
                  className={`flex items-center justify-between px-6 py-3 text-sm ${i !== stats.receivables.length - 1 ? "border-b border-black/[0.02]" : ""}`}
                >
                  <span className={cat.label.includes("overdue") && cat.amount > 0 ? "text-primary font-medium" : "text-muted-foreground"}>
                    {cat.label}
                  </span>
                  <span className="font-semibold">{formatCurrency(cat.amount, baseCurrency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payables Column */}
          <div className="flex flex-col">
            <div className="px-6 py-3 bg-muted/30 border-b border-border/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bills you owe</span>
            </div>
            <div className="flex flex-col">
              {stats.payables.map((cat, i) => (
                <div
                  key={cat.label}
                  className={`flex items-center justify-between px-6 py-3 text-sm ${i !== stats.payables.length - 1 ? "border-b border-black/[0.02]" : ""}`}
                >
                  <span className={cat.label.includes("overdue") && cat.amount > 0 ? "text-primary font-medium" : "text-muted-foreground"}>
                    {cat.label}
                  </span>
                  <span className="font-semibold">{formatCurrency(cat.amount, baseCurrency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-muted/10 border-t border-border/50 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Net Position</span>
              <span
                className="text-lg font-semibold"
                style={{ color: (stats.receivables.reduce((a, b) => a + b.amount, 0) - stats.payables.reduce((a, b) => a + b.amount, 0)) >= 0 ? "var(--chart-1)" : "var(--chart-5)" }}
              >
                {formatCurrency(stats.receivables.reduce((a, b) => a + b.amount, 0) - stats.payables.reduce((a, b) => a + b.amount, 0), baseCurrency)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground italic">Includes unpaid invoices and bills</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

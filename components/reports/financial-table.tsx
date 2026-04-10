"use client"

import { cn } from "@/lib/utils"

export type FinancialRow = {
  id: string
  code: string
  name: string
  balance: number
}

export function FinancialTable({
  title,
  rows,
  type = "neutral",
}: {
  title: string
  rows: FinancialRow[]
  type?: "revenue" | "expense" | "neutral"
}) {
  const total = rows.reduce((acc, row) => acc + row.balance, 0)

  return (
    <div className="flex flex-col h-full border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-black/[0.03]">
        <h3 className={cn(
          "text-sm font-medium",
          type === "revenue" ? "text-green-600" : type === "expense" ? "text-red-600" : "text-[#141413]"
        )}>
          {title}
        </h3>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black/[0.02] bg-black/[0.01] text-xs font-medium text-[#141413]">
              <th className="px-5 py-2 text-left w-20">Code</th>
              <th className="px-5 py-2 text-left">Account Name</th>
              <th className="px-5 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground italic text-xs">
                  No accounts found for this period
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-black/[0.02] hover:bg-muted/50 transition-colors group">
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{row.code}</td>
                  <td className="px-5 py-2.5 font-medium group-hover:text-primary transition-colors">{row.name}</td>
                  <td className="px-5 py-2.5 text-right font-mono font-bold tracking-tight">
                    {(row.balance / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-black/[0.03] flex justify-between items-center">
        <span className="text-xs font-medium text-[#141413]">Total {title}</span>
        <span className={cn(
          "text-sm font-bold font-mono tracking-tight",
          type === "revenue" ? "text-green-600" : type === "expense" ? "text-red-600" : "text-foreground"
        )}>
          {(total / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}

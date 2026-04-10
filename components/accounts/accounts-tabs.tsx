"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  ClockArrowUp, 
  Landmark, 
  Scale, 
  TrendingUp, 
  FileSearch 
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function AccountsTabs({
  transactions,
  bills,
  bankAccounts,
  reconciliation,
  reports,
  unsorted,
}: {
  transactions: React.ReactNode
  bills: React.ReactNode
  bankAccounts: React.ReactNode
  reconciliation: React.ReactNode
  reports: React.ReactNode
  unsorted: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "transactions"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    
    // Reset other common pagination/filter params when switching tabs
    // unless you want to preserve them. Usually, it's safer to clear
    // page-specific filters when switching main domain tabs.
    if (value !== activeTab) {
      const newParams = new URLSearchParams()
      newParams.set("tab", value)
      router.push(`/accounts?${newParams.toString()}`, { scroll: false })
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="transactions" className="gap-2">
          <FileText className="h-4 w-4" />
          Transactions
        </TabsTrigger>
        <TabsTrigger value="bills" className="gap-2">
          <ClockArrowUp className="h-4 w-4" />
          Bills
        </TabsTrigger>
        <TabsTrigger value="bank-accounts" className="gap-2">
          <Landmark className="h-4 w-4" />
          Bank accounts
        </TabsTrigger>
        <TabsTrigger value="reconciliation" className="gap-2">
          <Scale className="h-4 w-4" />
          Reconciliation
        </TabsTrigger>
        <TabsTrigger value="reports" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Reports
        </TabsTrigger>
        <TabsTrigger value="unsorted" className="gap-2">
          <FileSearch className="h-4 w-4" />
          Unsorted
        </TabsTrigger>
      </TabsList>

      <TabsContent value="transactions" className="border-none p-0 outline-none">
        {transactions}
      </TabsContent>
      <TabsContent value="bills" className="border-none p-0 outline-none">
        {bills}
      </TabsContent>
      <TabsContent value="bank-accounts" className="border-none p-0 outline-none">
        {bankAccounts}
      </TabsContent>
      <TabsContent value="reconciliation" className="border-none p-0 outline-none">
        {reconciliation}
      </TabsContent>
      <TabsContent value="reports" className="border-none p-0 outline-none">
        {reports}
      </TabsContent>
      <TabsContent value="unsorted" className="border-none p-0 outline-none">
        {unsorted}
      </TabsContent>
    </Tabs>
  )
}

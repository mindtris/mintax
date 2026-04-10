import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getAccountBalances } from "@/lib/services/chart-accounts"
import { getDashboardStats } from "@/lib/services/stats"
import { ReportsDashboard } from "./reports-dashboard"

export async function ReportsView({ searchParams }: { searchParams: Promise<any> }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const params = await searchParams
  
  const [stats, accountBalances] = await Promise.all([
    getDashboardStats(org.id, params),
    getAccountBalances(org.id, params.dateFrom, params.dateTo)
  ])

  return (
    <ReportsDashboard 
      stats={stats} 
      accountBalances={accountBalances} 
      orgName={org.name} 
    />
  )
}

import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { QuicklinksGrid } from "@/components/quicklinks/quicklinks-grid"
import { NewQuicklinkSheet } from "@/components/quicklinks/new-quicklink-sheet"
import { EmptyState } from "@/components/ui/empty-state"
import { RemindersWidget } from "@/components/dashboard/reminders-widget"

import { StatsWidget } from "@/components/dashboard/stats-widget"
import { QuickActionsWidget } from "@/components/dashboard/quick-actions-widget"
import { CreateProjectButton } from "@/components/dashboard/projects-widget"
import { ProjectInsightCard } from "@/components/dashboard/project-insight-card"
import { CashFlowWidget } from "@/components/dashboard/cash-flow-widget"
import { ProfitLossWidget } from "@/components/dashboard/profit-loss-widget"
import { PayableOwingWidget } from "@/components/dashboard/payable-owing-widget"
import { ExpenseBreakdownWidget } from "@/components/dashboard/expense-breakdown-widget"
import { NetIncomeWidget } from "@/components/dashboard/net-income-widget"
import { EngageWidget } from "@/components/dashboard/engage-widget"
import { CustomersWidget } from "@/components/dashboard/customers-widget"
import { PeopleWidget } from "@/components/dashboard/people-widget"
import { HireWidget } from "@/components/dashboard/hire-widget"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import config from "@/lib/core/config"
import { prisma } from "@/lib/core/db"
import { getUnsortedFiles } from "@/lib/services/files"
import { getOverdueRemindersCount, getUpcomingReminders } from "@/lib/services/reminders"
import { getSettings } from "@/lib/services/settings"
import { getQuicklinks } from "@/lib/services/quicklinks"
import { getCategoriesByType } from "@/lib/services/categories"
import { TransactionFilters } from "@/lib/services/transactions"
import { getTimeSeriesStats, getDetailedTimeSeriesStats, getProjectStats } from "@/lib/services/stats"
import { getReport } from "@/lib/services/reporting"
import { getBankAccounts } from "@/lib/services/bank-accounts"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: config.app.description,
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<TransactionFilters> }) {
  const filters = await searchParams
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  
  const [
    unsortedFiles,
    settings,
    upcomingReminders,
    overdueCount,
    quicklinks,
    quicklinkCategories,
    timeSeriesData,
    detailedTimeSeriesData,
    agingStats,
    fyComparison,
    bankAccounts,
    projects
  ] = await Promise.all([
    getUnsortedFiles(org.id),
    getSettings(org.id),
    getUpcomingReminders(org.id, 5),
    getOverdueRemindersCount(org.id),
    getQuicklinks(org.id),
    getCategoriesByType(org.id, "quicklink"),
    getTimeSeriesStats(org.id, filters),
    getDetailedTimeSeriesStats(org.id, filters),
    getReport("accounts-aging", org.id),
    getReport("accounts-fiscal-comparison", org.id),
    getBankAccounts(org.id),
    prisma.project.findMany({ where: { organizationId: org.id } })
  ])

  // Fetch individual project stats and time series
  const [statsPerProject, timeSeriesPerProjectRaw] = await Promise.all([
    Promise.all(
      projects.map(async (project) => ({
        code: project.code,
        stats: await getProjectStats(org.id, project.code, filters),
      }))
    ),
    Promise.all(
      projects.map(async (project) => ({
        code: project.code,
        data: await getTimeSeriesStats(org.id, { ...filters, projectCode: project.code }),
      }))
    )
  ])

  const statsMap = Object.fromEntries(statsPerProject.map((p) => [p.code, p.stats]))
  const timeSeriesMap = Object.fromEntries(timeSeriesPerProjectRaw.map((p) => [p.code, p.data]))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Hello, {user.name?.split(" ")[0] || "there"}!</h1>

      <DashboardTabs
        quicklinksContent={
          quicklinks.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Available Quicklinks</h2>
                <NewQuicklinkSheet categories={quicklinkCategories} />
              </div>
              <QuicklinksGrid links={quicklinks} />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Available Quicklinks</h2>
                  <NewQuicklinkSheet categories={quicklinkCategories} />
                </div>
                <EmptyState
                  title="Quicklinks"
                  description="Store and organize your most used links and resources."
                />
            </div>
          )
        }
        accountsContent={
          <div className="flex flex-col gap-6">
            <StatsWidget filters={filters} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <CashFlowWidget data={timeSeriesData} />
              <ProfitLossWidget data={timeSeriesData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <PayableOwingWidget stats={agingStats} />
              <NetIncomeWidget data={fyComparison} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-2">
                <ExpenseBreakdownWidget data={detailedTimeSeriesData} />
              </div>
              <QuickActionsWidget files={unsortedFiles} orgName={org.name} />
            </div>

            {bankAccounts.length > 0 && (
              <div className="bg-[#f5f4ef] text-[#141413] rounded-2xl border border-black/[0.03] shadow-sm shadow-black/[0.02] p-6">
                <h2 className="text-xl font-semibold tracking-tight mb-4">Bank accounts</h2>
                <div className="flex flex-col gap-3">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between border-b border-black/[0.02] pb-2 last:border-0 last:pb-0">
                      <span className="text-sm font-medium">{account.name}</span>
                      <span className="text-sm font-semibold">
                        {((account.currentBalance || 0) / 100).toLocaleString("en-IN", { style: "currency", currency: account.currency || "INR" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
              <div className="lg:col-span-3">
                <ProjectInsightCard 
                  projects={projects as any} 
                  statsPerProject={statsMap} 
                  timeSeriesPerProject={timeSeriesMap} 
                />
              </div>
              <div className="lg:col-span-1">
                <CreateProjectButton />
              </div>
            </div>
          </div>
        }
        engageContent={<EngageWidget />}
        customersContent={<CustomersWidget />}
        peopleContent={
          <div className="flex flex-col gap-6">
            <PeopleWidget />
            <RemindersWidget reminders={upcomingReminders} overdueCount={overdueCount} />
          </div>
        }
        hireContent={<HireWidget />}
      />
    </div>
  )
}

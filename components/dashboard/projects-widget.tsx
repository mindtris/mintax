import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ProjectStats } from "@/lib/services/stats"
import { Project } from "@/lib/prisma/client"
import { Plus } from "lucide-react"
import Link from "next/link"

export function ProjectsWidget({
  projects,
  statsPerProject,
  hideCreate = false,
}: {
  projects: Project[]
  statsPerProject: Record<string, ProjectStats>
  hideCreate?: boolean
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <Link key={project.code} href={`/transactions?projectCode=${project.code}`}>
          <Card className="border border-black/[0.03] shadow-lg shadow-black/[0.02] bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md cursor-pointer flex flex-col p-5 min-h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <Badge
                className="text-xs font-semibold"
                style={{ backgroundColor: project.color, color: "#fff" }}
              >
                {project.name}
              </Badge>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest opacity-50">{project.code}</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.02] pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Income</span>
                  <span className="text-sm font-semibold text-foreground">
                    {Object.entries(statsPerProject[project.code]?.totalIncomePerCurrency).map(([currency, total]) => (
                      <div key={currency}>{formatCurrency(total, currency)}</div>
                    ))}
                    {!Object.entries(statsPerProject[project.code]?.totalIncomePerCurrency).length && "₹0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-black/[0.02] pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expenses</span>
                  <span className="text-sm font-semibold text-foreground">
                    {Object.entries(statsPerProject[project.code]?.totalExpensesPerCurrency).map(
                      ([currency, total]) => (
                        <div key={currency}>{formatCurrency(total, currency)}</div>
                      )
                    )}
                    {!Object.entries(statsPerProject[project.code]?.totalExpensesPerCurrency).length && "₹0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net profit</span>
                  <span className="text-sm font-semibold text-foreground">
                    {Object.entries(statsPerProject[project.code]?.profitPerCurrency).map(([currency, total]) => (
                      <div key={currency}>{formatCurrency(total, currency)}</div>
                    ))}
                    {!Object.entries(statsPerProject[project.code]?.profitPerCurrency).length && "₹0.00"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
      {!hideCreate && (
        <CreateProjectButton />
      )}
    </div>
  )
}

export function CreateProjectButton() {
  return (
    <Link
      href="/settings/projects"
      className="group flex flex-col items-center justify-center gap-4 border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl p-8 hover:border-primary/20 transition-all h-full min-h-[350px]"
    >
      <div className="h-14 w-14 rounded-full bg-black/[0.03] flex items-center justify-center group-hover:shadow-sm transition-all border border-transparent group-hover:border-black/[0.03]">
        <Plus className="h-6 w-6 text-[#141413] group-hover:text-primary transition-colors" />
      </div>
      <div className="text-center">
        <span className="font-semibold text-sm block mb-1">Create new project</span>
        <p className="text-xs text-[#141413] font-medium">Add new business vertical</p>
      </div>
    </Link>
  )
}


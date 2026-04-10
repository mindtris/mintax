import { DataGrid } from "@/components/ui/data-grid"
import Image from "next/image"

export function OnboardingView() {
  const columns = [
    { key: "name", label: "Employee" },
    { key: "startDate", label: "Start date" },
    { key: "checklist", label: "Checklist" },
    { key: "progress", label: "Progress" },
    { key: "status", label: "Status" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Onboarding</h1>
      </header>
      <DataGrid
        data={[]}
        columns={columns}
        emptyIcon={<Image src="/empty-state.svg" alt="No onboarding" width={120} height={120} priority />}
        emptyTitle="Onboarding"
        emptyDescription="Manage onboarding checklists and new hire flows. Coming soon."
      />
    </div>
  )
}

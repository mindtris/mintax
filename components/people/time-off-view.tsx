import { DataGrid } from "@/components/ui/data-grid"
import Image from "next/image"

export function TimeOffView() {
  const columns = [
    { key: "employee", label: "Employee" },
    { key: "type", label: "Type" },
    { key: "startDate", label: "Start date" },
    { key: "endDate", label: "End date" },
    { key: "status", label: "Status" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Time off</h1>
      </header>
      <DataGrid
        data={[]}
        columns={columns}
        emptyIcon={<Image src="/empty-state.svg" alt="No time off requests" width={120} height={120} priority />}
        emptyTitle="Time off"
        emptyDescription="Track time off requests, balances, and approvals. Coming soon."
      />
    </div>
  )
}

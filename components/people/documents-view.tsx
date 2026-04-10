import { DataGrid } from "@/components/ui/data-grid"
import Image from "next/image"

export function DocumentsView() {
  const columns = [
    { key: "name", label: "Document" },
    { key: "type", label: "Type" },
    { key: "uploadedBy", label: "Uploaded by" },
    { key: "date", label: "Date" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Documents</h1>
      </header>
      <DataGrid
        data={[]}
        columns={columns}
        emptyIcon={<Image src="/empty-state.svg" alt="No documents" width={120} height={120} priority />}
        emptyTitle="Documents"
        emptyDescription="Store and manage employee documents. Coming soon."
      />
    </div>
  )
}

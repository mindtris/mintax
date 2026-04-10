"use client"

import { KanbanBoard } from "./pipeline/kanban-board"

export function PipelineViewClient({ initialData, stages }: { initialData: Record<string, any[]>; stages: any[] }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Pipeline</h1>
      </header>

      <KanbanBoard initialData={initialData} stages={stages} />
    </div>
  )
}

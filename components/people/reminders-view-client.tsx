"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { RemindersList } from "./reminders-list"

type Props = {
  reminders: any[]
  members: any[]
  categories: any[]
  currentUserId: string
  count: number
}

export function RemindersViewClient({ reminders, members, categories, currentUserId, count }: Props) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Reminders</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-border/50 border shadow-sm">
            {count}
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden md:block">New reminder</span>
        </Button>
      </header>

      <RemindersList
        reminders={reminders}
        members={members}
        categories={categories}
        currentUserId={currentUserId}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
      />
    </div>
  )
}

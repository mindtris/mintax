"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CATEGORY_LABELS, PRIORITY_LABELS, REMINDER_CATEGORIES, REMINDER_PRIORITIES } from "@/lib/schemas/reminders"
import { Plus, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { ReminderCard } from "./reminder-card"
import { ReminderForm } from "./reminder-form"

type Props = {
  reminders: any[]
  members: any[]
  currentUserId: string
}

export function RemindersPage({ reminders, members, currentUserId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<any>(null)
  const [search, setSearch] = useState(searchParams.get("search") || "")

  const currentStatus = searchParams.get("status") || "all"
  const currentCategory = searchParams.get("category") || "all"
  const currentPriority = searchParams.get("priority") || "all"

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all" || !value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  function handleSearch() {
    updateFilter("search", search)
  }

  const pendingCount = reminders.filter((r) => r.status === "pending").length
  const overdueCount = reminders.filter((r) => r.status === "pending" && new Date(r.dueAt) < new Date()).length

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-[400px]">
          <Input
            placeholder="Search reminders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-background"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Select value={currentStatus} onValueChange={(v) => updateFilter("status", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="snoozed">Snoozed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentCategory} onValueChange={(v) => updateFilter("category", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {REMINDER_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentPriority} onValueChange={(v) => updateFilter("priority", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {REMINDER_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Reminder</DialogTitle>
              </DialogHeader>
              <ReminderForm members={members} currentUserId={currentUserId} onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      {overdueCount > 0 && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
          {overdueCount} overdue reminder{overdueCount !== 1 ? "s" : ""} need attention
        </div>
      )}

      {/* Reminder list */}
      <div className="flex flex-col gap-3">
        {reminders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <p className="text-lg">No reminders found</p>
            <p className="text-sm">Create your first reminder to stay on top of deadlines</p>
          </div>
        )}

        {reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            members={members}
            currentUserId={currentUserId}
            onEdit={() => setEditingReminder(reminder)}
          />
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingReminder} onOpenChange={(open) => !open && setEditingReminder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
          </DialogHeader>
          {editingReminder && (
            <ReminderForm
              reminder={editingReminder}
              members={members}
              currentUserId={currentUserId}
              onSuccess={() => setEditingReminder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

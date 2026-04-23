"use client"

import { FormDate, FormInput, FormSelect, FormTextarea } from "@/components/forms/simple"
import { FormSelectCategory } from "@/components/forms/select-category"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  REMINDER_CATEGORIES,
  REMINDER_PRIORITIES,
  REMINDER_RECURRENCES,
} from "@/lib/schemas/reminders"
import { useActionState } from "react"
import { createReminderAction, updateReminderAction } from "../actions"

import { toast } from "sonner"

type Props = {
  initialData?: any // standardized prop name
  members: any[]
  categories: any[]
  currentUserId: string
  onSuccess?: () => void
}

export function ReminderForm({ initialData: reminder, members, categories, currentUserId, onSuccess }: Props) {
  const isEdit = !!reminder
  const action = isEdit ? updateReminderAction : createReminderAction

  const [state, formAction, isPending] = useActionState(action, null)

  const handleSuccess = () => {
    toast.success(isEdit ? "Reminder updated" : "Reminder created")
    if (onSuccess) onSuccess()
  }

  if (state?.success) {
    // Defer to next tick to avoid React warning
    setTimeout(handleSuccess, 0)
  }

  const categoryItems = REMINDER_CATEGORIES.map((c) => ({ code: c, name: CATEGORY_LABELS[c] }))
  const priorityItems = REMINDER_PRIORITIES.map((p) => ({ code: p, name: PRIORITY_LABELS[p] }))
  const recurrenceItems = REMINDER_RECURRENCES.map((r) => ({ code: r, name: RECURRENCE_LABELS[r] }))
  const memberItems = members.map((m: any) => ({
    code: m.user?.id || m.userId,
    name: m.user?.name || m.user?.email || "Member",
  }))

  const notifyMinuteOptions = [
    { code: "15", name: "15 minutes before" },
    { code: "30", name: "30 minutes before" },
    { code: "60", name: "1 hour before" },
    { code: "120", name: "2 hours before" },
    { code: "1440", name: "1 day before" },
    { code: "4320", name: "3 days before" },
    { code: "10080", name: "1 week before" },
  ]

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isEdit && <input type="hidden" name="reminderId" value={reminder.id} />}

      <FormInput
        name="title"
        title="Title"
        placeholder="e.g. File GST returns"
        defaultValue={reminder?.title}
        isRequired
      />

      <FormTextarea
        name="description"
        title="Description"
        placeholder="Add details about this reminder..."
        defaultValue={reminder?.description}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormDate
          name="dueAt"
          title="Due date"
          defaultValue={reminder?.dueAt ? new Date(reminder.dueAt) : undefined}
        />

        <FormSelectCategory
          name="category"
          title="Category"
          categories={categories}
          defaultValue={reminder?.category || "custom"}
          addNewHref="/settings?tab=categories"
          addNewLabel="Add a new category"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          name="priority"
          title="Priority"
          items={priorityItems}
          defaultValue={reminder?.priority || "medium"}
        />

        <FormSelect
          name="recurrence"
          title="Recurrence"
          items={recurrenceItems}
          defaultValue={reminder?.recurrence || "one_time"}
        />
      </div>

      {/* Assignees */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Assign to team members</span>
        <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto rounded-md border p-2">
          {memberItems.length === 0 && (
            <p className="text-sm text-muted-foreground">No team members available</p>
          )}
          {memberItems.map((member) => {
            const isAssigned = reminder?.assignees?.some((a: any) => a.userId === member.code)
            return (
              <label key={member.code} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="assigneeUserIds"
                  value={member.code}
                  defaultChecked={isAssigned}
                  className="rounded"
                />
                <span>{member.name}</span>
                {member.code === currentUserId && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Email notifications */}
      <div className="flex flex-col gap-3 rounded-md border p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="hidden" name="emailNotify" value="false" />
          <input
            type="checkbox"
            name="emailNotify"
            value="true"
            defaultChecked={reminder?.emailNotify ?? false}
            className="rounded"
          />
          <span className="text-sm font-medium">Send email notification</span>
        </label>

        <FormSelect
          name="emailNotifyMinutesBefore"
          items={notifyMinuteOptions}
          defaultValue={String(reminder?.emailNotifyMinutesBefore ?? 60)}
          placeholder="When to notify"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full h-11">
        {isPending ? "Saving..." : isEdit ? "Update reminder" : "Create reminder"}
      </Button>
    </form>
  )
}

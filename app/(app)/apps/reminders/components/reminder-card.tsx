"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { CATEGORY_LABELS, PRIORITY_LABELS, RECURRENCE_LABELS } from "@/lib/schemas/reminders"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { Check, Clock, MoreVertical, Pencil, Repeat, Trash2, Users } from "lucide-react"
import { completeReminderAction, deleteReminderAction } from "../actions"
import { useState } from "react"
import { toast } from "sonner"

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const CATEGORY_ICONS: Record<string, string> = {
  tax_deadline: "\u{1F4CB}",
  invoice_due: "\u{1F4B0}",
  bookkeeping_task: "\u{1F4DA}",
  custom: "\u{1F4CC}",
}

type Props = {
  reminder: any
  members: any[]
  currentUserId: string
  onEdit: () => void
}

export function ReminderCard({ reminder, members, currentUserId, onEdit }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const dueDate = new Date(reminder.dueAt)
  const isOverdue = isPast(dueDate) && reminder.status === "pending"
  const isCompleted = reminder.status === "completed"

  const assigneeNames = reminder.assignees
    ?.map((a: any) => {
      const member = members.find((m: any) => (m.user?.id || m.userId) === a.userId)
      const name = member?.user?.name || member?.user?.email || "Unknown"
      return a.userId === currentUserId ? "You" : name
    })
    .slice(0, 3)

  async function handleComplete() {
    await completeReminderAction(reminder.id)
  }

  async function handleDelete() {
    try {
      await deleteReminderAction(reminder.id)
      toast.success("Reminder deleted")
    } catch (e) {
      toast.error("Failed to delete reminder")
    } finally {
      setShowDeleteDialog(false)
    }
  }

  return (
    <Card
      className={cn(
        "transition-colors",
        isOverdue && "border-destructive/50",
        isCompleted && "opacity-60"
      )}
    >
      <CardContent className="flex items-start gap-4 py-4">
        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={isCompleted}
          className={cn(
            "mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            isCompleted
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30 hover:border-primary"
          )}
        >
          {isCompleted && <Check className="w-3 h-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={cn("font-medium", isCompleted && "line-through")}>
              {CATEGORY_ICONS[reminder.category] || ""} {reminder.title}
            </span>

            <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[reminder.priority])}>
              {PRIORITY_LABELS[reminder.priority]}
            </Badge>

            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[reminder.category]}
            </Badge>

            {reminder.recurrence !== "one_time" && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Repeat className="w-3 h-3" />
                {RECURRENCE_LABELS[reminder.recurrence]}
              </Badge>
            )}
          </div>

          {reminder.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reminder.description}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
              <Clock className="w-3 h-3" />
              {isOverdue ? "Overdue " : ""}
              {format(dueDate, "MMM d, yyyy")}
              {" \u00B7 "}
              {formatDistanceToNow(dueDate, { addSuffix: true })}
            </span>

            {assigneeNames && assigneeNames.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {assigneeNames.join(", ")}
                {reminder.assignees.length > 3 && ` +${reminder.assignees.length - 3}`}
              </span>
            )}

            {reminder.emailNotify && (
              <span className="flex items-center gap-1">
                {"\u2709\uFE0F"} Email notification
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            {!isCompleted && (
              <DropdownMenuItem onClick={handleComplete}>
                <Check className="h-4 w-4 mr-2" /> Complete
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

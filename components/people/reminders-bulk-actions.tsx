"use client"

import { Button } from "@/components/ui/button"
import { Check, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { completeReminderAction, deleteReminderAction } from "@/app/(app)/apps/reminders/actions"
import { useRouter } from "next/navigation"

interface RemindersBulkActionsProps {
  selectedIds: string[]
  onActionComplete?: () => void
}

export function RemindersBulkActions({ selectedIds, onActionComplete }: RemindersBulkActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    try {
      setIsLoading(true)
      await Promise.all(selectedIds.map(id => completeReminderAction(id)))
      toast.success("Reminders marked as completed")
      onActionComplete?.()
      router.refresh()
    } catch (error) {
      toast.error("Failed to complete reminders")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} reminders?`)) return
    try {
      setIsLoading(true)
      await Promise.all(selectedIds.map(id => deleteReminderAction(id)))
      toast.success("Reminders deleted")
      onActionComplete?.()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete reminders")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-primary text-primary-foreground border border-primary/20 shadow-2xl rounded-xl px-4 py-3 flex items-center gap-4 min-w-[320px]">
        <div className="flex flex-col">
          <span className="text-xs font-bold leading-tight">{selectedIds.length} reminder{selectedIds.length > 1 ? "s" : ""} selected</span>
          <span className="text-[10px] opacity-80">Bulk management actions</span>
        </div>
        <div className="h-6 w-[1px] bg-primary-foreground/20 mx-1" />
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 gap-1.5 font-bold text-[11px]" 
            disabled={isLoading} 
            onClick={handleComplete}
          >
            <Check className="h-3.5 w-3.5" />
            Complete
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8 shadow-sm gap-1.5 font-bold text-[11px]" 
            disabled={isLoading} 
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

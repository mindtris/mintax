"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { bulkDeleteQuicklinksAction } from "@/app/(app)/people/actions"

interface QuicklinksBulkActionsProps {
  selectedIds: string[]
  onActionComplete?: () => void
}

export function QuicklinksBulkActions({ selectedIds, onActionComplete }: QuicklinksBulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete these ${selectedIds.length} quicklinks?`)) return

    try {
      setIsLoading(true)
      const res = await bulkDeleteQuicklinksAction(selectedIds)
      
      if (!res.success) throw new Error(res.error || "Failed to delete quicklinks")

      toast.success("Quicklinks deleted")
      onActionComplete?.()
    } catch (error: any) {
      console.error("Failed to delete quicklinks:", error)
      toast.error(error.message || "Failed to delete quicklinks")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-primary text-primary-foreground border border-primary/20 shadow-2xl rounded-xl px-4 py-3 flex items-center gap-4 min-w-[280px]">
        <div className="flex flex-col">
          <span className="text-xs font-bold leading-tight">{selectedIds.length} link{selectedIds.length > 1 ? "s" : ""} selected</span>
          <span className="text-[10px] opacity-80">Bulk management actions</span>
        </div>
        <div className="h-6 w-[1px] bg-primary-foreground/20 mx-1" />
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-8 gap-1.5 font-bold text-[11px]" 
          disabled={isLoading} 
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}

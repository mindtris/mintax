"use client"

import { Button } from "@/components/ui/button"
import { Trash2, UserX } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { bulkRemoveMembersAction } from "@/app/(app)/people/actions"

interface DirectoryBulkActionsProps {
  selectedIds: string[]
  onActionComplete?: () => void
}

export function DirectoryBulkActions({ selectedIds, onActionComplete }: DirectoryBulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove these ${selectedIds.length} members from the organization?`)) return

    try {
      setIsLoading(true)
      const result = await bulkRemoveMembersAction(selectedIds)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("Members removed from organization")
      onActionComplete?.()
    } catch (error) {
      console.error("Failed to remove members:", error)
      toast.error(`Failed to remove members: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-primary text-primary-foreground border border-primary/20 shadow-2xl rounded-xl px-4 py-3 flex items-center gap-4 min-w-[280px]">
        <div className="flex flex-col">
          <span className="text-xs font-bold leading-tight">{selectedIds.length} member{selectedIds.length > 1 ? "s" : ""} selected</span>
          <span className="text-[10px] opacity-80">Bulk management actions</span>
        </div>
        <div className="h-6 w-[1px] bg-primary-foreground/20 mx-1" />
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-8 gap-1.5 font-bold text-[11px]" 
          disabled={isLoading} 
          onClick={handleRemove}
        >
          <UserX className="h-3.5 w-3.5" />
          Remove from org
        </Button>
      </div>
    </div>
  )
}

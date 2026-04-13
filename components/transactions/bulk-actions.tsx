"use client"

import {
  bulkDeleteTransactionsAction,
  reconcileTransactionsAction,
  approveTransactionsAction,
} from "@/app/(app)/transactions/actions"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Trash2, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface BulkActionsMenuProps {
  selectedIds: string[]
  onActionComplete?: () => void
}

export function BulkActionsMenu({ selectedIds, onActionComplete }: BulkActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    const confirmMessage =
      "Are you sure you want to delete these transactions and all their files? This action cannot be undone."
    if (!confirm(confirmMessage)) return

    try {
      setIsLoading(true)
      const result = await bulkDeleteTransactionsAction(selectedIds)
      if (!result.success) throw new Error(result.error || "Action failed")
      toast.success(`Deleted ${selectedIds.length} transactions`)
      onActionComplete?.()
    } catch (error) {
      console.error("Failed to delete transactions:", error)
      toast.error(`Failed to delete: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReconcile = async (reconciled: boolean) => {
    try {
      setIsLoading(true)
      const result = await reconcileTransactionsAction(selectedIds, reconciled)
      if (!result.success) throw new Error(result.error || "Action failed")
      toast.success(
        reconciled
          ? `Marked ${result.data?.count} transactions as reconciled`
          : `Unmarked ${result.data?.count} transactions`,
      )
      onActionComplete?.()
      router.refresh()
    } catch (error) {
      console.error("Failed to reconcile:", error)
      toast.error(`Failed to reconcile: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setIsLoading(true)
      const result = await approveTransactionsAction(selectedIds)
      if (!result.success) throw new Error(result.error || "Action failed")
      toast.success(`Approved ${result.data?.count} transactions`)
      onActionComplete?.()
      router.refresh()
    } catch (error) {
      console.error("Failed to approve:", error)
      toast.error(`Failed to approve: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-background shadow-lg p-2">
      <span className="text-xs text-muted-foreground px-2 font-medium">
        {selectedIds.length} selected
      </span>

      <Button
        variant="secondary"
        size="sm"
        disabled={isLoading}
        onClick={() => handleReconcile(true)}
      >
        <CheckCircle2 className="h-4 w-4 mr-1" />
        Reconcile
      </Button>

      <Button
        variant="secondary"
        size="sm"
        disabled={isLoading}
        onClick={() => handleReconcile(false)}
      >
        <Circle className="h-4 w-4 mr-1" />
        Unreconcile
      </Button>

      <Button
        variant="secondary"
        size="sm"
        disabled={isLoading}
        onClick={handleApprove}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        Approve
      </Button>

      <Button variant="destructive" size="sm" disabled={isLoading} onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

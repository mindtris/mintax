"use client"

import { migrateLegacyDataAction } from "@/app/(app)/settings/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, ArrowRight } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

export function MigrationHub({ orgId }: { orgId: string }) {
  const [isPending, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState(false)

  const handleMigrate = () => {
    startTransition(async () => {
      const result = await migrateLegacyDataAction(orgId)
      if (result.success) {
        toast.success("System upgraded successfully")
        setDismissed(true)
      } else {
        toast.error("Upgrade failed. Please try again.")
      }
    })
  }

  if (dismissed) return null

  return (
    <Card className="p-6 bg-primary/[0.02] border-primary/10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Universal System Upgrade</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Transition your organization to the professional 10-type category system.</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground bg-background p-4 rounded-xl border border-black/[0.03]">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-1 shrink-0 text-primary" />
              <span>Converts legacy <b>'transaction'</b> categories to universal <b>'expense'</b> types.</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-1 shrink-0 text-primary" />
              <span>Enables tabbed filtering in the Categories hub for better organization.</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-1 shrink-0 text-primary" />
              <span>Hardens historical bill data for production-grade reporting.</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={handleMigrate}
          disabled={isPending}
          className="px-6 w-fit"
        >
          {isPending ? "Migrating data..." : "Migrate legacy data"}
        </Button>
      </div>
    </Card>
  )
}

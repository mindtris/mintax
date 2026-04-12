"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/schemas/reminders"
import { cn } from "@/lib/utils"
import { format, isPast } from "date-fns"
import { AlertTriangle, Bell, Clock } from "lucide-react"
import Link from "next/link"

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

type Props = {
  reminders: any[]
  overdueCount: number
}

export function RemindersWidget({ reminders, overdueCount }: Props) {
  return (
    <Card className="w-full h-full bg-card text-card-foreground border border-border/50 shadow-sm shadow-black/[0.02] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <Link href="/people?tab=reminders" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </Link>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overdueCount} overdue
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {reminders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming reminders</p>
          )}
          {reminders.map((reminder) => {
            const dueDate = new Date(reminder.dueAt)
            const isOverdue = isPast(dueDate)
            return (
              <Link
                key={reminder.id}
                href="/people?tab=reminders"
                className="rounded-md p-2 bg-background hover:bg-foreground hover:text-background transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-xs font-semibold">{reminder.title}</span>
                    <span className={cn("truncate text-xs", isOverdue && "text-destructive")}>
                      <Clock className="inline h-3 w-3 mr-1" />
                      {format(dueDate, "MMM d")}
                    </span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] flex-shrink-0", PRIORITY_COLORS[reminder.priority])}>
                    {PRIORITY_LABELS[reminder.priority]}
                  </Badge>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

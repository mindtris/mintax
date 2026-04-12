"use client"

import {
  addScheduleAction,
  editScheduleAction,
  pauseScheduleAction,
  resumeScheduleAction,
  deleteScheduleAction,
} from "@/app/(app)/settings/actions"
import { Button } from "@/components/ui/button"
import { DataGrid, DataGridColumn } from "@/components/ui/data-grid"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EllipsisVertical, Pause, Play, Plus, Trash2 } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Schedule {
  id: string
  module: string
  name: string
  frequency: string
  interval: number
  startAt: Date | string
  nextRunAt: Date | string
  lastRunAt: Date | string | null
  limitBy: string | null
  limitCount: number | null
  limitDate: Date | string | null
  runCount: number
  autoSend: boolean
  templateData: any
  status: string
  createdAt: Date | string
}

interface ScheduleRow {
  id: string
  name: string
  module: string
  frequency: string
  nextRun: string
  lastRun: string
  runs: string
  status: string
  isDeletable: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MODULE_OPTIONS = [
  { label: "Invoice", value: "invoice" },
  { label: "Bill", value: "bill" },
  { label: "Transaction", value: "transaction" },
  { label: "Reminder", value: "reminder" },
  { label: "Social post", value: "social_post" },
]

const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
]

const LIMIT_OPTIONS = [
  { label: "No limit", value: "none" },
  { label: "After X occurrences", value: "count" },
  { label: "Until date", value: "date" },
]

const MODULE_COLORS: Record<string, string> = {
  invoice: "bg-primary/10 text-primary rounded-full",
  bill: "bg-accent text-accent-foreground rounded-full",
  transaction: "bg-secondary text-secondary-foreground rounded-full",
  reminder: "bg-muted text-muted-foreground rounded-full",
  social_post: "bg-primary/10 text-primary rounded-full",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-primary/10 text-primary rounded-full",
  paused: "bg-muted text-muted-foreground rounded-full",
  completed: "bg-accent text-accent-foreground rounded-full",
  cancelled: "bg-muted text-muted-foreground rounded-full",
}

function getModuleLabel(m: string) {
  return MODULE_OPTIONS.find((o) => o.value === m)?.label || m
}

function getFrequencyLabel(f: string, interval: number) {
  if (interval === 1) return FREQUENCY_OPTIONS.find((o) => o.value === f)?.label || f
  const units: Record<string, string> = { daily: "days", weekly: "weeks", monthly: "months", yearly: "years" }
  return `Every ${interval} ${units[f] || f}`
}

function safeFormat(d: Date | string | null, fmt: string) {
  if (!d) return "—"
  try { return format(new Date(d), fmt) } catch { return "—" }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ScheduleSettingsView({ schedules }: { schedules: Schedule[] }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    module: "invoice",
    frequency: "monthly",
    interval: "1",
    startAt: "",
    limitBy: "none",
    limitCount: "",
    limitDate: "",
    autoSend: false,
  })

  const rows: ScheduleRow[] = useMemo(
    () => schedules.map((s) => ({
      id: s.id,
      name: s.name,
      module: s.module,
      frequency: getFrequencyLabel(s.frequency, s.interval),
      nextRun: safeFormat(s.nextRunAt, "MMM d, yyyy"),
      lastRun: safeFormat(s.lastRunAt, "MMM d, yyyy"),
      runs: s.limitBy === "count" && s.limitCount ? `${s.runCount}/${s.limitCount}` : String(s.runCount),
      status: s.status,
      isDeletable: true,
    })),
    [schedules]
  )

  const openAddSheet = useCallback(() => {
    setEditingSchedule(null)
    setForm({ name: "", module: "invoice", frequency: "monthly", interval: "1", startAt: format(new Date(), "yyyy-MM-dd"), limitBy: "none", limitCount: "", limitDate: "", autoSend: false })
    setSheetOpen(true)
  }, [])

  const openEditSheet = useCallback((row: ScheduleRow) => {
    const schedule = schedules.find((s) => s.id === row.id)
    if (!schedule) return
    setEditingSchedule(schedule)
    setForm({
      name: schedule.name,
      module: schedule.module,
      frequency: schedule.frequency,
      interval: String(schedule.interval),
      startAt: safeFormat(schedule.startAt, "yyyy-MM-dd"),
      limitBy: schedule.limitBy || "none",
      limitCount: schedule.limitCount ? String(schedule.limitCount) : "",
      limitDate: schedule.limitDate ? safeFormat(schedule.limitDate, "yyyy-MM-dd") : "",
      autoSend: schedule.autoSend,
    })
    setSheetOpen(true)
  }, [schedules])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const data = {
        ...form,
        limitBy: form.limitBy === "none" ? null : form.limitBy,
        templateData: editingSchedule?.templateData || {},
      }
      const result = editingSchedule
        ? await editScheduleAction(editingSchedule.id, data)
        : await addScheduleAction(data)
      if (result.success) {
        toast.success(editingSchedule ? "Schedule updated" : "Schedule created")
        setSheetOpen(false)
      } else {
        toast.error(result.error || "Failed to save")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }, [form, editingSchedule])

  const handlePause = useCallback(async (id: string) => {
    const result = await pauseScheduleAction(id)
    if (result.success) toast.success("Schedule paused")
    else toast.error(result.error || "Failed")
  }, [])

  const handleResume = useCallback(async (id: string) => {
    const result = await resumeScheduleAction(id)
    if (result.success) toast.success("Schedule resumed")
    else toast.error(result.error || "Failed")
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteScheduleAction(id)
    if (result.success) toast.success("Schedule deleted")
    else toast.error(result.error || "Failed")
  }, [])

  const columns: DataGridColumn<ScheduleRow>[] = [
    { key: "name", label: "Schedule", sortable: true, className: "font-semibold" },
    {
      key: "module", label: "Module", sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${MODULE_COLORS[row.module] || "bg-muted text-muted-foreground rounded-full"}`}>
          {getModuleLabel(row.module)}
        </span>
      ),
    },
    { key: "frequency", label: "Frequency", sortable: true },
    { key: "nextRun", label: "Next run", sortable: true },
    { key: "runs", label: "Runs" },
    {
      key: "status", label: "Status", sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[row.status] || "bg-muted text-muted-foreground rounded-full"}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "__actions", label: "", align: "right",
      render: (row) => {
        const schedule = schedules.find((s) => s.id === row.id)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {schedule?.status === "active" && (
                <DropdownMenuItem onClick={() => handlePause(row.id)}>
                  <Pause className="h-4 w-4" /> Pause
                </DropdownMenuItem>
              )}
              {schedule?.status === "paused" && (
                <DropdownMenuItem onClick={() => handleResume(row.id)}>
                  <Play className="h-4 w-4" /> Resume
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(row.id)}>
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">Schedules</h2>
            <div className="bg-secondary text-sm px-2 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
              {schedules.length}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Recurring invoices, bills, transactions, reminders, and social posts.
          </p>
        </div>
        <Button onClick={openAddSheet}>
          <Plus className="h-4 w-4" />
          <span className="hidden md:block">New schedule</span>
        </Button>
      </div>

      <DataGrid
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={openEditSheet}
        emptyTitle="No schedules"
        emptyDescription="Create your first recurring schedule to automate invoices, bills, and more."
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>{editingSchedule ? "Edit schedule" : "New schedule"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Schedule name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Monthly hosting invoice" />
            </div>

            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={form.module} onValueChange={(v) => setForm((p) => ({ ...p, module: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((p) => ({ ...p, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">Interval</Label>
                <Input id="interval" type="number" min={1} value={form.interval} onChange={(e) => setForm((p) => ({ ...p, interval: e.target.value }))} />
                <p className="text-[10px] text-muted-foreground">Every N {form.frequency === "daily" ? "days" : form.frequency === "weekly" ? "weeks" : form.frequency === "monthly" ? "months" : "years"}</p>
              </div>
            </div>

            {!editingSchedule && (
              <div className="space-y-2">
                <Label htmlFor="startAt">Start date</Label>
                <Input id="startAt" type="date" value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} />
              </div>
            )}

            <div className="space-y-2">
              <Label>End condition</Label>
              <Select value={form.limitBy} onValueChange={(v) => setForm((p) => ({ ...p, limitBy: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIMIT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.limitBy === "count" && (
              <div className="space-y-2">
                <Label htmlFor="limitCount">Max occurrences</Label>
                <Input id="limitCount" type="number" min={1} value={form.limitCount} onChange={(e) => setForm((p) => ({ ...p, limitCount: e.target.value }))} placeholder="12" />
              </div>
            )}

            {form.limitBy === "date" && (
              <div className="space-y-2">
                <Label htmlFor="limitDate">End date</Label>
                <Input id="limitDate" type="date" value={form.limitDate} onChange={(e) => setForm((p) => ({ ...p, limitDate: e.target.value }))} />
              </div>
            )}

            <label className="flex items-center gap-3 py-2">
              <Checkbox checked={form.autoSend} onCheckedChange={(checked) => setForm((p) => ({ ...p, autoSend: !!checked }))} />
              <div>
                <span className="text-sm font-medium">Auto-send email</span>
                <p className="text-[10px] text-muted-foreground">Automatically send email when the item is created (invoices only).</p>
              </div>
            </label>
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="secondary" onClick={() => setSheetOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

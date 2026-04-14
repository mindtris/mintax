import { z } from "zod"

export const REMINDER_CATEGORIES = ["tax_deadline", "invoice_due", "bookkeeping_task", "custom"] as const
export const REMINDER_PRIORITIES = ["low", "medium", "high", "urgent"] as const
export const REMINDER_STATUSES = ["pending", "completed", "snoozed", "cancelled"] as const
export const REMINDER_RECURRENCES = ["one_time", "daily", "weekly", "monthly", "yearly"] as const

export const reminderFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  dueAt: z
    .union([
      z.date(),
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .transform((val) => new Date(val)),
    ]),
  category: z.string().min(1, "Category is required").default("custom"),
  priority: z.enum(REMINDER_PRIORITIES).default("medium"),
  recurrence: z.enum(REMINDER_RECURRENCES).default("one_time"),
  recurrenceEndAt: z
    .union([
      z.date(),
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .transform((val) => new Date(val)),
    ])
    .optional()
    .nullable(),
  emailNotify: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .default(false),
  emailNotifyMinutesBefore: z
    .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
    .default(60),
  assigneeUserIds: z
    .union([
      z.array(z.string()),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return []
        try {
          return JSON.parse(val)
        } catch {
          return val.split(",").filter(Boolean)
        }
      }),
    ])
    .default([]),
})

export type ReminderFormData = z.infer<typeof reminderFormSchema>

export const CATEGORY_LABELS: Record<string, string> = {
  tax_deadline: "Tax Deadline",
  invoice_due: "Invoice Due",
  bookkeeping_task: "Bookkeeping Task",
  custom: "Custom",
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

export const RECURRENCE_LABELS: Record<string, string> = {
  one_time: "One Time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
}

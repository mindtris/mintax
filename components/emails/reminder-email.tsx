import React from "react"
import { EmailLayout } from "./email-layout"

const BRAND = {
  primary: "#c96442",
  foreground: "#362f28",
  muted: "#6b6460",
  card: "#f2ede7",
  border: "#d9d4ce",
}

interface ReminderEmailProps {
  reminderTitle: string
  description?: string | null
  dueAt: string
  category: string
  priority: string
  orgName: string
  appUrl: string
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "#6b6460",
  medium: "#2563eb",
  high: "#ea580c",
  urgent: "#dc2626",
}

const CATEGORY_LABELS: Record<string, string> = {
  tax_deadline: "Tax deadline",
  invoice_due: "Invoice due",
  bookkeeping_task: "Bookkeeping task",
  custom: "Reminder",
}

export const ReminderEmail: React.FC<ReminderEmailProps> = ({
  reminderTitle,
  description,
  dueAt,
  category,
  priority,
  orgName,
  appUrl,
}) => (
  <EmailLayout preview={`Reminder: ${reminderTitle}`}>
    <p style={{
      fontSize: "11px",
      color: BRAND.primary,
      margin: "0 0 12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontWeight: 600,
    }}>
      {CATEGORY_LABELS[category] || "Reminder"}
    </p>

    <p style={{ fontSize: "18px", fontWeight: 600, color: BRAND.foreground, margin: "0 0 8px", lineHeight: "1.3" }}>
      {reminderTitle}
    </p>

    {description && (
      <p style={{ fontSize: "14px", color: BRAND.muted, margin: "0 0 20px", lineHeight: "1.5" }}>
        {description}
      </p>
    )}

    <div style={{
      backgroundColor: BRAND.card,
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "20px",
    }}>
      <table cellPadding={0} cellSpacing={0} width="100%">
        <tbody>
          <tr>
            <td style={{ fontSize: "13px", color: BRAND.muted, paddingBottom: "8px", width: "100px" }}>Due</td>
            <td style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "8px", fontWeight: 500 }}>{dueAt}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: BRAND.muted, paddingBottom: "8px" }}>Priority</td>
            <td style={{ fontSize: "13px", color: PRIORITY_COLORS[priority] || BRAND.foreground, fontWeight: 600, paddingBottom: "8px" }}>
              {PRIORITY_LABELS[priority] || priority}
            </td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: BRAND.muted }}>Organization</td>
            <td style={{ fontSize: "13px", color: BRAND.foreground }}>{orgName}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <a
      href={`${appUrl}/apps/reminders`}
      style={{
        display: "inline-block",
        padding: "10px 24px",
        backgroundColor: BRAND.primary,
        color: "#ffffff",
        textDecoration: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
      }}
    >
      View reminders
    </a>
  </EmailLayout>
)

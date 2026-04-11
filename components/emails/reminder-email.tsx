import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface ReminderEmailProps {
  reminderTitle: string
  description?: string | null
  dueAt: string
  category: string
  priority: string
  orgName: string
  appUrl: string
  customFooterNote?: string | null
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
  customFooterNote,
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
      borderRadius: "12px",
      padding: "24px",
      marginBottom: "24px",
      border: `1px solid ${BRAND.border}`,
    }}>
      <table cellPadding={0} cellSpacing={0} width="100%">
        <tbody>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Due</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{dueAt}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Priority</td>
            <td align="right" style={{ fontSize: "13px", color: PRIORITY_COLORS[priority] || BRAND.foreground, fontWeight: 700, paddingBottom: "12px" }}>
              {PRIORITY_LABELS[priority] || priority}
            </td>
          </tr>
          <tr>
            <td style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}`, fontSize: "12px", color: BRAND.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Organization</td>
            <td align="right" style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}`, fontSize: "13px", color: BRAND.foreground, fontWeight: 500 }}>{orgName}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {customFooterNote && (
      <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0 0 8px", lineHeight: "1.6" }}>
        {customFooterNote}
      </p>
    )}

    <div style={{ textAlign: "center", marginTop: "32px", marginBottom: "8px" }}>
      <a
        href={`${appUrl}/hire/pipeline`}
        style={{
          display: "inline-block",
          padding: "12px 32px",
          backgroundColor: BRAND.primary,
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        View Pipeline
      </a>
    </div>
  </EmailLayout>
)

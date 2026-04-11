import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface InvoiceRecurringEmailProps {
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  recurrence: string
  orgName: string
  appUrl: string
  /** "customer" or "admin" — determines tone */
  recipient: "customer" | "admin"
  customFooterNote?: string | null
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
}

export const InvoiceRecurringEmail: React.FC<InvoiceRecurringEmailProps> = ({
  invoiceNumber,
  clientName,
  total,
  currency,
  dueDate,
  recurrence,
  orgName,
  appUrl,
  recipient,
  customFooterNote,
}) => (
  <EmailLayout preview={`Recurring invoice ${invoiceNumber} generated`}>
    <p style={{
      fontSize: "11px",
      color: BRAND.primary,
      margin: "0 0 12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontWeight: 600,
    }}>
      Recurring invoice
    </p>

    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "1.4" }}>
      {recipient === "customer"
        ? `Invoice from ${orgName}`
        : `Recurring invoice generated`}
    </h1>

    {recipient === "customer" ? (
      <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
        Hi {clientName},<br />
        A new {RECURRENCE_LABELS[recurrence] || recurrence} invoice has been generated for your account with <strong>{orgName}</strong>.
      </p>
    ) : (
      <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
        A {RECURRENCE_LABELS[recurrence] || recurrence} recurring invoice has been automatically generated for <strong>{clientName}</strong>.
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
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Invoice number</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 700 }}>{invoiceNumber}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Frequency</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{RECURRENCE_LABELS[recurrence] || recurrence}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Due date</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{dueDate}</td>
          </tr>
          <tr>
            <td style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "12px", color: BRAND.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</span>
            </td>
            <td align="right" style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "20px", color: BRAND.primary, fontWeight: 700 }}>{currency} {total}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style={{ textAlign: "center", marginBottom: "32px", marginTop: "32px" }}>
      <a href={recipient === "customer" ? appUrl : `${appUrl}/invoices`} style={{
        backgroundColor: BRAND.primary,
        color: "#ffffff",
        padding: "12px 32px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        display: "inline-block",
      }}>
        {recipient === "customer" ? "View & Pay Invoice" : "View Invoices"}
      </a>
    </div>

    <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0", lineHeight: "1.6" }}>
      {customFooterNote || (recipient === "customer"
        ? "Thank you for your continued business."
        : `This is an automated notification from ${orgName}.`)}
    </p>
  </EmailLayout>
)

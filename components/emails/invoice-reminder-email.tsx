import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface InvoiceReminderEmailProps {
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  appUrl: string
  status: string
  /** "customer" or "admin" — determines tone */
  recipient: "customer" | "admin"
  customFooterNote?: string | null
}

export const InvoiceReminderEmail: React.FC<InvoiceReminderEmailProps> = ({
  invoiceNumber,
  clientName,
  total,
  currency,
  dueDate,
  orgName,
  appUrl,
  status,
  recipient,
  customFooterNote,
}) => (
  <EmailLayout preview={`Invoice ${invoiceNumber} is ${status}`}>
    <p style={{
      fontSize: "11px",
      color: status === "overdue" ? "#dc2626" : BRAND.primary,
      margin: "0 0 12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontWeight: 600,
    }}>
      {status === "overdue" ? "Overdue invoice" : "Invoice reminder"}
    </p>

    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "1.4" }}>
      Invoice {invoiceNumber} {status === "overdue" ? "is overdue" : "is due soon"}
    </h1>

    {recipient === "customer" ? (
      <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
        Hi {clientName},<br />
        {status === "overdue"
          ? <>Your invoice <strong>{invoiceNumber}</strong> from <strong>{orgName}</strong> is now past due. Please arrange payment at your earliest convenience.</>
          : <>This is a friendly reminder that invoice <strong>{invoiceNumber}</strong> from <strong>{orgName}</strong> is due on <strong>{dueDate}</strong>.</>}
      </p>
    ) : (
      <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
        {status === "overdue"
          ? <>Invoice <strong>{invoiceNumber}</strong> for <strong>{clientName}</strong> is now overdue. Consider sending a follow-up or contacting the client.</>
          : <>Invoice <strong>{invoiceNumber}</strong> for <strong>{clientName}</strong> is approaching its due date.</>}
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
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Client</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{clientName}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Due date</td>
            <td align="right" style={{ fontSize: "13px", color: status === "overdue" ? "#dc2626" : BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{dueDate}</td>
          </tr>
          <tr>
            <td style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "12px", color: BRAND.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount due</span>
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
        ? "If you have already sent the payment, please disregard this reminder."
        : `This is an automated reminder from ${orgName}.`)}
    </p>
  </EmailLayout>
)

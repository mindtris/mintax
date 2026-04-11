import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface BillReminderEmailProps {
  billNumber: string
  vendorName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  appUrl: string
  status: string
  customFooterNote?: string | null
}

export const BillReminderEmail: React.FC<BillReminderEmailProps> = ({
  billNumber,
  vendorName,
  total,
  currency,
  dueDate,
  orgName,
  appUrl,
  status,
  customFooterNote,
}) => (
  <EmailLayout preview={`Bill ${billNumber} is ${status}`}>
    <p style={{
      fontSize: "11px",
      color: status === "overdue" ? "#dc2626" : BRAND.primary,
      margin: "0 0 12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontWeight: 600,
    }}>
      {status === "overdue" ? "Overdue bill" : "Bill reminder"}
    </p>

    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "1.4" }}>
      Bill {billNumber} from {vendorName}
    </h1>

    <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
      {status === "overdue"
        ? <>A bill from <strong>{vendorName}</strong> is now overdue. Please review and process payment as soon as possible.</>
        : <>A bill from <strong>{vendorName}</strong> is due soon. Please review and arrange payment before the due date.</>}
    </p>

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
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bill number</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 700 }}>{billNumber}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vendor</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{vendorName}</td>
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
      <a href={`${appUrl}/accounts?tab=bills`} style={{
        backgroundColor: BRAND.primary,
        color: "#ffffff",
        padding: "12px 32px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        display: "inline-block",
      }}>
        View Bill
      </a>
    </div>

    <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0", lineHeight: "1.6" }}>
      {customFooterNote || `This is an automated reminder from ${orgName}.`}
    </p>
  </EmailLayout>
)

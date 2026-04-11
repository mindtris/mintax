import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface InvoiceEmailProps {
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  notes?: string | null
  appUrl: string
  customGreeting?: string | null
  customFooterNote?: string | null
  customFooterText?: string | null
}

export const InvoiceEmail: React.FC<InvoiceEmailProps> = ({
  invoiceNumber,
  clientName,
  total,
  currency,
  dueDate,
  orgName,
  notes,
  appUrl,
  customGreeting,
  customFooterNote,
  customFooterText,
}) => (
  <EmailLayout preview={`Invoice ${invoiceNumber} from ${orgName}`}>
    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "1.4" }}>
      Invoice from {orgName}
    </h1>
    
    <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
      Hi {clientName},<br />
      {customGreeting
        ? customGreeting.replace(/\{clientName\}/g, clientName).replace(/\{orgName\}/g, orgName).replace(/\{invoiceNumber\}/g, invoiceNumber)
        : <>A new invoice has been generated for your recent project with <strong>{orgName}</strong>.</>}
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
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Invoice Number</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 700 }}>{invoiceNumber}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Due Date</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{dueDate}</td>
          </tr>
          <tr>
            <td style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "12px", color: BRAND.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount Due</span>
            </td>
            <td align="right" style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "20px", color: BRAND.primary, fontWeight: 700 }}>{currency} {total}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {notes && (
      <div style={{ 
        padding: "16px", 
        borderLeft: `4px solid ${BRAND.border}`, 
        backgroundColor: BRAND.background, 
        marginBottom: "24px",
        borderRadius: "4px"
      }}>
        <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0", lineHeight: "1.6", fontStyle: "italic" }}>
          {notes}
        </p>
      </div>
    )}

    <div style={{ textAlign: "center", marginBottom: "32px", marginTop: "32px" }}>
      <a href={appUrl} style={{
        backgroundColor: BRAND.primary,
        color: "#ffffff",
        padding: "12px 32px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        display: "inline-block",
      }}>
        View & Pay Invoice
      </a>
    </div>

    <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0", lineHeight: "1.6" }}>
      {customFooterNote || "Thank you for your business. If you have any questions, feel free to contact us by replying to this email."}
    </p>
  </EmailLayout>
)

import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface InvoicePaymentEmailProps {
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  paidDate: string
  orgName: string
  appUrl: string
  /** "customer" = receipt to client, "admin" = notification to admin */
  recipient: "customer" | "admin"
  customFooterNote?: string | null
}

export const InvoicePaymentEmail: React.FC<InvoicePaymentEmailProps> = ({
  invoiceNumber,
  clientName,
  total,
  currency,
  paidDate,
  orgName,
  appUrl,
  recipient,
  customFooterNote,
}) => (
  <EmailLayout preview={recipient === "customer" ? `Payment receipt for ${invoiceNumber}` : `Payment received for ${invoiceNumber}`}>
    <p style={{
      fontSize: "11px",
      color: "#16a34a",
      margin: "0 0 12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontWeight: 600,
    }}>
      {recipient === "customer" ? "Payment receipt" : "Payment received"}
    </p>

    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "1.4" }}>
      {recipient === "customer"
        ? `Payment confirmed for invoice ${invoiceNumber}`
        : `Payment received for invoice ${invoiceNumber}`}
    </h1>

    {recipient === "customer" ? (
      <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
        Hi {clientName},<br />
        We have received your payment for invoice <strong>{invoiceNumber}</strong>. Thank you for your prompt payment.
      </p>
    ) : (
      <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
        Payment has been received from <strong>{clientName}</strong> for invoice <strong>{invoiceNumber}</strong>. The invoice has been marked as paid.
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
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment date</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{paidDate}</td>
          </tr>
          <tr>
            <td style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "12px", color: BRAND.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount paid</span>
            </td>
            <td align="right" style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "20px", color: "#16a34a", fontWeight: 700 }}>{currency} {total}</span>
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
        {recipient === "customer" ? "View Receipt" : "View Invoices"}
      </a>
    </div>

    <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0", lineHeight: "1.6" }}>
      {customFooterNote || (recipient === "customer"
        ? "Thank you for your business. This email serves as your payment receipt."
        : `This is an automated notification from ${orgName}.`)}
    </p>
  </EmailLayout>
)

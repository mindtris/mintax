import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface PaymentReceiptEmailProps {
  /** Bill or invoice number */
  referenceNumber: string
  /** Vendor or client name depending on context */
  recipientName: string
  total: string
  currency: string
  paidDate: string
  paymentMethod?: string | null
  orgName: string
  appUrl: string
  /** "customer" = receipt sent to customer, "vendor" = payment made notification sent to vendor */
  recipient: "customer" | "vendor"
  customFooterNote?: string | null
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  upi: "UPI",
  card: "Card",
  cheque: "Cheque",
}

export const PaymentReceiptEmail: React.FC<PaymentReceiptEmailProps> = ({
  referenceNumber,
  recipientName,
  total,
  currency,
  paidDate,
  paymentMethod,
  orgName,
  appUrl,
  recipient,
  customFooterNote,
}) => (
  <EmailLayout preview={recipient === "customer" ? `Payment receipt from ${orgName}` : `Payment made to ${recipientName}`}>
    <p style={{
      fontSize: "11px",
      color: "#16a34a",
      margin: "0 0 12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontWeight: 600,
    }}>
      {recipient === "customer" ? "Payment receipt" : "Payment made"}
    </p>

    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "1.4" }}>
      {recipient === "customer"
        ? "Your payment has been received"
        : `Payment sent to ${recipientName}`}
    </h1>

    {recipient === "customer" ? (
      <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
        Hi {recipientName},<br />
        This confirms that <strong>{orgName}</strong> has received your payment. Here are the details:
      </p>
    ) : (
      <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "1.6" }}>
        A payment has been made to <strong>{recipientName}</strong> for bill <strong>{referenceNumber}</strong>.
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
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reference</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 700 }}>{referenceNumber}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{recipient === "customer" ? "From" : "To"}</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{recipient === "customer" ? orgName : recipientName}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</td>
            <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{paidDate}</td>
          </tr>
          {paymentMethod && (
            <tr>
              <td style={{ fontSize: "12px", color: BRAND.muted, paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Method</td>
              <td align="right" style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "12px", fontWeight: 500 }}>{PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}</td>
            </tr>
          )}
          <tr>
            <td style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "12px", color: BRAND.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</span>
            </td>
            <td align="right" style={{ paddingTop: "12px", borderTop: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: "20px", color: "#16a34a", fontWeight: 700 }}>{currency} {total}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
        View Details
      </a>
    </div>

    <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0", lineHeight: "1.6" }}>
      {customFooterNote || "This email serves as your payment confirmation."}
    </p>
  </EmailLayout>
)

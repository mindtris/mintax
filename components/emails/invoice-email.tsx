import React from "react"
import { EmailLayout } from "./email-layout"

const BRAND = {
  primary: "#c96442",
  foreground: "#362f28",
  muted: "#6b6460",
  card: "#f2ede7",
}

interface InvoiceEmailProps {
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  notes?: string | null
  appUrl: string
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
}) => (
  <EmailLayout preview={`Invoice ${invoiceNumber} from ${orgName}`}>
    <p style={{ fontSize: "11px", color: BRAND.primary, margin: "0 0 12px", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 600 }}>
      Invoice
    </p>

    <p style={{ fontSize: "15px", color: BRAND.foreground, margin: "0 0 20px", lineHeight: "1.6" }}>
      Hi {clientName},
    </p>

    <p style={{ fontSize: "15px", color: BRAND.foreground, margin: "0 0 20px", lineHeight: "1.6" }}>
      Please find below the details of your invoice from <strong>{orgName}</strong>.
    </p>

    <div style={{
      backgroundColor: BRAND.card,
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "20px",
    }}>
      <table cellPadding={0} cellSpacing={0} width="100%">
        <tbody>
          <tr>
            <td style={{ fontSize: "13px", color: BRAND.muted, paddingBottom: "8px", width: "120px" }}>Invoice #</td>
            <td style={{ fontSize: "13px", color: BRAND.foreground, paddingBottom: "8px", fontWeight: 600 }}>{invoiceNumber}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: BRAND.muted, paddingBottom: "8px" }}>Amount due</td>
            <td style={{ fontSize: "18px", color: BRAND.primary, paddingBottom: "8px", fontWeight: 700 }}>{currency} {total}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: BRAND.muted }}>Due date</td>
            <td style={{ fontSize: "13px", color: BRAND.foreground, fontWeight: 500 }}>{dueDate}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {notes && (
      <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0 0 20px", lineHeight: "1.5", fontStyle: "italic" }}>
        {notes}
      </p>
    )}

    <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0", lineHeight: "1.5" }}>
      If you have any questions, please reply to this email.
    </p>
  </EmailLayout>
)

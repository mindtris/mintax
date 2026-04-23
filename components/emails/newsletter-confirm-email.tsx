import React from "react"
import { EmailLayout, BRAND } from "@/components/emails/email-layout"

interface NewsletterConfirmEmailProps {
  confirmUrl: string
  expiresInHours?: number
}

export const NewsletterConfirmEmail: React.FC<NewsletterConfirmEmailProps> = ({
  confirmUrl,
  expiresInHours = 24,
}) => (
  <EmailLayout preview="Confirm your newsletter subscription">
    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "1.4" }}>
      Confirm your subscription
    </h1>

    <p style={{ fontSize: "14px", lineHeight: "1.6", color: BRAND.foreground, margin: "0 0 24px" }}>
      Tap the button below to confirm you&apos;d like to receive updates from us. The link expires in {expiresInHours} hours.
    </p>

    <div style={{ margin: "0 0 24px" }}>
      <a
        href={confirmUrl}
        style={{
          display: "inline-block",
          backgroundColor: BRAND.foreground,
          color: BRAND.background,
          padding: "12px 20px",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        Confirm subscription
      </a>
    </div>

    <p style={{ fontSize: "12px", lineHeight: "1.6", color: BRAND.muted, margin: "0 0 8px" }}>
      If the button doesn&apos;t work, copy this link:
    </p>
    <p style={{ fontSize: "12px", lineHeight: "1.5", color: BRAND.muted, margin: "0 0 24px", wordBreak: "break-all" }}>
      {confirmUrl}
    </p>

    <div style={{ marginTop: "24px", borderTop: `1px solid ${BRAND.border}`, paddingTop: "16px" }}>
      <p style={{ fontSize: "12px", color: BRAND.muted, margin: 0, lineHeight: "1.6" }}>
        If you didn&apos;t request this, you can safely ignore this email — no subscription will be created.
      </p>
    </div>
  </EmailLayout>
)

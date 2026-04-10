import React from "react"
import { EmailLayout } from "./email-layout"

const BRAND = {
  primary: "#c96442",
  foreground: "#362f28",
  muted: "#6b6460",
  card: "#f2ede7",
}

interface OTPEmailProps {
  otp: string
}

export const OTPEmail: React.FC<OTPEmailProps> = ({ otp }) => (
  <EmailLayout preview="Your Mintax verification code">
    <p style={{ fontSize: "15px", color: BRAND.foreground, margin: "0 0 20px", lineHeight: "1.6" }}>
      Here is your verification code for Mintax:
    </p>
    <div style={{
      backgroundColor: BRAND.card,
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center" as const,
      marginBottom: "20px",
    }}>
      <p style={{
        fontSize: "32px",
        fontWeight: 700,
        letterSpacing: "0.2em",
        color: BRAND.primary,
        margin: 0,
        fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
      }}>
        {otp}
      </p>
    </div>
    <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0 0 4px", lineHeight: "1.5" }}>
      This code expires in 10 minutes.
    </p>
    <p style={{ fontSize: "13px", color: BRAND.muted, margin: "0", lineHeight: "1.5" }}>
      If you didn&apos;t request this, you can safely ignore this email.
    </p>
  </EmailLayout>
)

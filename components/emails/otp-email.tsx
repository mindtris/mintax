import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface OTPEmailProps {
  otp: string
}

export const OTPEmail: React.FC<OTPEmailProps> = ({ otp }) => (
  <EmailLayout preview="Your Mintax verification code">
    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "24px" }}>
      Verification Code
    </h1>
    <p style={{ fontSize: "14px", color: BRAND.foreground, margin: "0 0 24px", lineHeight: "22px" }}>
      To complete your sign-in, please enter the following verification code on the Mintax sign-in page.
    </p>
    <div style={{
      backgroundColor: BRAND.card,
      borderRadius: "12px",
      padding: "32px",
      textAlign: "center" as const,
      marginBottom: "24px",
      border: `1px solid ${BRAND.border}`,
    }}>
      <p style={{
        fontSize: "36px",
        fontWeight: 700,
        letterSpacing: "0.25em",
        color: BRAND.primary,
        margin: 0,
        fontFamily: "'Roboto Mono', 'Source Code Pro', Menlo, Monaco, Consolas, monospace",
      }}>
        {otp}
      </p>
    </div>
    <p style={{ fontSize: "12px", color: BRAND.muted, margin: "0 0 8px", lineHeight: "18px" }}>
      This code is valid for 10 minutes.
    </p>
    <p style={{ fontSize: "12px", color: BRAND.muted, margin: "0", lineHeight: "18px" }}>
      If you didn&apos;t request this code, you can safely ignore this email.
    </p>
  </EmailLayout>
)

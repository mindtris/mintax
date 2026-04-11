import React from "react"
import { EmailLayout, BRAND } from "./email-layout"

interface NewsletterWelcomeEmailProps {
  customGreeting?: string | null
}

export const NewsletterWelcomeEmail: React.FC<NewsletterWelcomeEmailProps> = ({ customGreeting } = {}) => (
  <EmailLayout preview="Welcome to Mintax Newsletter!">
    <h1 style={{ fontSize: "20px", fontWeight: 700, color: BRAND.foreground, margin: "0 0 16px", lineHeight: "1.4" }}>
      👋 Welcome to Mintax!
    </h1>

    <p style={{ fontSize: "14px", lineHeight: "1.6", color: BRAND.foreground, margin: "0 0 16px" }}>
      {customGreeting || "Thank you for subscribing to our updates."} We&apos;ll keep you posted on our latest developments, including:
    </p>
    
    <ul
      style={{
        paddingLeft: "24px",
        fontSize: "14px",
        lineHeight: "1.6",
        color: BRAND.foreground,
        margin: "0 0 24px",
      }}
    >
      <li style={{ marginBottom: "8px" }}>New features and performance improvements</li>
      <li style={{ marginBottom: "8px" }}>Roadmaps and project timelines</li>
      <li style={{ marginBottom: "8px" }}>Updates about our enterprise solutions</li>
    </ul>

    <div style={{ marginTop: "32px", borderTop: `1px solid ${BRAND.border}`, paddingTop: "24px" }}>
      <p style={{ fontSize: "14px", color: BRAND.muted, margin: 0, lineHeight: "1.6" }}>
        Best regards,<br />
        <strong>The Mintax Team</strong>
      </p>
    </div>
  </EmailLayout>
)

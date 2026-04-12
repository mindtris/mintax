import React from "react"
import { BRAND, EmailLayout } from "./email-layout"

interface GenericEmailProps {
  subject: string
  greeting?: string | null
  body: string
  footer?: string | null
  globalFooterText?: string | null
}

/**
 * A generic, customizable email component that renders dynamic content.
 * Body text supports simple line breaks (\n).
 */
export const GenericEmail: React.FC<GenericEmailProps> = ({
  subject,
  greeting,
  body,
  footer,
  globalFooterText,
}) => {
  return (
    <EmailLayout preview={subject} footerText={globalFooterText}>
      {greeting && (
        <p style={{
          fontSize: "16px",
          fontWeight: 600,
          color: BRAND.foreground,
          margin: "0 0 16px",
        }}>
          {greeting}
        </p>
      )}

      {/* Main content body */}
      <div style={{
        fontSize: "15px",
        lineHeight: "24px",
        color: "#4a443f",
        margin: "0 0 24px",
        whiteSpace: "pre-wrap", // Preserves line breaks from the database
      }}>
        {body}
      </div>

      {footer && (
        <div style={{
          paddingTop: "24px",
          borderTop: `1px solid ${BRAND.border}`,
          fontSize: "14px",
          lineHeight: "22px",
          color: BRAND.muted,
          fontStyle: "italic",
        }}>
          {footer}
        </div>
      )}
    </EmailLayout>
  )
}

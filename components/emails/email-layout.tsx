import React from "react"

interface EmailLayoutProps {
  children: React.ReactNode
  preview?: string
}

// Mintax brand colors (from CSS tokens)
const BRAND = {
  primary: "#c96442",       // hsl(14, 53%, 53%)
  background: "#f9f6f1",    // hsl(43, 33%, 97%)
  foreground: "#362f28",    // hsl(36, 12%, 19%)
  muted: "#6b6460",         // hsl(40, 2%, 42%)
  card: "#f2ede7",          // hsl(40, 17%, 95%)
  border: "#d9d4ce",        // hsl(40, 5%, 84%)
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, preview = "" }) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light" />
      {preview && <title>{preview}</title>}
    </head>
    <body style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      margin: 0,
      padding: 0,
      backgroundColor: BRAND.background,
      color: BRAND.foreground,
      WebkitFontSmoothing: "antialiased",
    }}>
      <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: BRAND.background }}>
        <tbody>
          <tr>
            <td align="center" style={{ padding: "40px 20px 20px" }}>
              {/* Logo */}
              <img
                src={`${process.env.BASE_URL || "http://localhost:7331"}/logo/logo.svg`}
                alt="Mintax"
                width={36}
                height={36}
                style={{ display: "block", margin: "0 auto 8px" }}
              />
            </td>
          </tr>
          <tr>
            <td align="center" style={{ padding: "0 20px" }}>
              <table width="100%" cellPadding={0} cellSpacing={0} style={{
                maxWidth: "480px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: `1px solid ${BRAND.border}`,
                overflow: "hidden",
              }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "32px" }}>
                      {children}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style={{ padding: "24px 20px 40px" }}>
              <p style={{
                fontSize: "12px",
                color: BRAND.muted,
                margin: 0,
                lineHeight: "1.5",
              }}>
                Mintax by Mindtris&trade; Inc.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
)

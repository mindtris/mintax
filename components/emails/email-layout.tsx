import React from "react"

interface EmailLayoutProps {
  children: React.ReactNode
  preview?: string
  footerText?: string | null
}

export interface EmailBrand {
  primary: string
  background: string
  foreground: string
  muted: string
  card: string
  border: string
}

// Mintax brand colors (from CSS tokens)
export const BRAND: EmailBrand = {
  primary: "#c96442",       // hsl(14, 53%, 53%)
  background: "#f9f6f1",    // hsl(43, 33%, 97%)
  foreground: "#362f28",    // hsl(36, 12%, 19%)
  muted: "#6b6460",         // hsl(40, 2%, 42%)
  card: "#f2ede7",          // hsl(40, 17%, 95%)
  border: "#d9d4ce",        // hsl(40, 5%, 84%)
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, preview = "", footerText }) => (
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
        <td align="center" style={{ padding: "40px 20px 24px" }}>
          {/* Logo */}
          <img
            src="https://raw.githubusercontent.com/mindtris/mindtris-image-assets/main/logo.svg"
            alt="Mintax"
            width={40}
            height={40}
            style={{ display: "block" }}
          />
        </td>
      </tr>
      <tr>
        <td align="center" style={{ padding: "0 20px" }}>
          <table width="100%" cellPadding={0} cellSpacing={0} style={{
            maxWidth: "520px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: `1px solid ${BRAND.border}`,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <tbody>
              <tr>
                <td style={{ padding: "40px" }}>
                  {children}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style={{ padding: "32px 20px 64px" }}>
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: "520px" }}>
            <tbody>
              <tr>
                <td align="center">
                  <p style={{
                    fontSize: "11px",
                    lineHeight: "18px",
                    color: BRAND.muted,
                    margin: "0 0 12px",
                    textAlign: "center",
                  }}>
                    {footerText || "You received this email because you have a Mintax account."}
                  </p>
                  <div style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: BRAND.primary,
                    margin: "0 0 20px",
                    textAlign: "center",
                  }}>
                    <a href="https://mintax.app/help" style={{ color: BRAND.primary, textDecoration: "none" }}>Help Center</a>
                    &nbsp;&nbsp;•&nbsp;&nbsp;
                    <a href="https://mintax.app/support" style={{ color: BRAND.primary, textDecoration: "none" }}>Support</a>
                    &nbsp;&nbsp;•&nbsp;&nbsp;
                    <a href="https://mintax.app/privacy" style={{ color: BRAND.primary, textDecoration: "none" }}>Privacy Policy</a>
                  </div>
                  <p style={{
                    fontSize: "10px",
                    lineHeight: "16px",
                    color: BRAND.muted,
                    opacity: 0.7,
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    textAlign: "center",
                  }}>
                    Powered by Mindtris (Mintax) &bull; &copy; {new Date().getFullYear()} Mindtris&trade; Inc.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
    </body>
  </html>
)

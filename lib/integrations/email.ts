import { InvoiceEmail } from "@/components/emails/invoice-email"
import { NewsletterWelcomeEmail } from "@/components/emails/newsletter-welcome-email"
import { OTPEmail } from "@/components/emails/otp-email"
import { ReminderEmail } from "@/components/emails/reminder-email"
import React from "react"
import { Resend } from "resend"
import nodemailer from "nodemailer"
import config from "@/lib/core/config"
import { SettingsMap } from "@/lib/services/settings"

// ─────────────────────────────────────────────────────────────────────────────
// Transport layer — supports Resend API or SMTP
// ─────────────────────────────────────────────────────────────────────────────

let _resend: Resend | null = null
let _transporter: nodemailer.Transporter | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(config.email.apiKey || "re_placeholder")
  }
  return _resend
}

function getSmtpTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    const { host, port, username, password, encryption } = config.email.smtp
    _transporter = nodemailer.createTransport({
      host,
      port,
      secure: encryption === "ssl",
      auth: {
        user: username,
        pass: password,
      },
    })
  }
  return _transporter
}

async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: {
  to: string
  subject: string
  react: React.ReactElement
  replyTo?: string
}) {
  console.log(`[EMAIL] Sending "${subject}" to ${to} via ${config.email.driver}`)

  try {
    if (config.email.driver === "smtp") {
      const { renderToStaticMarkup } = await import("react-dom/server")
      const html = renderToStaticMarkup(react)
      const transporter = getSmtpTransporter()
      const result = await transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
        ...(replyTo ? { replyTo } : {}),
      })
      console.log(`[EMAIL] SMTP result: ${result.messageId}`)
      return { data: { id: result.messageId }, error: null }
    } else {
      const resend = getResend()
      const result = await resend.emails.send({
        from: config.email.from,
        to,
        subject,
        react,
        ...(replyTo ? { reply_to: replyTo } : {}),
      })
      console.log(`[EMAIL] Resend result:`, JSON.stringify(result))
      return result
    }
  } catch (error) {
    console.error(`[EMAIL] Failed:`, error)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Template variable interpolation helper
// ─────────────────────────────────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    template
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Email functions — accept optional settings for template customization
// ─────────────────────────────────────────────────────────────────────────────

export async function sendOTPCodeEmail({
  email,
  otp,
  emailSettings,
}: {
  email: string
  otp: string
  emailSettings?: SettingsMap
}) {
  const subject = emailSettings?.email_otp_subject || "Your Mintax verification code"

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(OTPEmail, { otp }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

export async function sendReminderNotificationEmail({
  email,
  reminderTitle,
  description,
  dueAt,
  category,
  priority,
  orgName,
  emailSettings,
}: {
  email: string
  reminderTitle: string
  description?: string | null
  dueAt: string
  category: string
  priority: string
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { reminderTitle, orgName, category }
  const subject = emailSettings?.email_reminder_subject
    ? interpolate(emailSettings.email_reminder_subject, vars)
    : `Reminder: ${reminderTitle}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(ReminderEmail, {
      reminderTitle,
      description,
      dueAt,
      category,
      priority,
      orgName,
      appUrl: config.app.baseURL,
      customFooterNote: emailSettings?.email_reminder_footer_note || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

export async function sendInvoiceEmail({
  email,
  invoiceNumber,
  clientName,
  total,
  currency,
  dueDate,
  orgName,
  notes,
  emailSettings,
}: {
  email: string
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  notes?: string | null
  emailSettings?: SettingsMap
}) {
  const vars = { invoiceNumber, orgName, clientName }
  const subject = emailSettings?.email_invoice_subject
    ? interpolate(emailSettings.email_invoice_subject, vars)
    : `Invoice ${invoiceNumber} from ${orgName}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(InvoiceEmail, {
      invoiceNumber,
      clientName,
      total,
      currency,
      dueDate,
      orgName,
      notes,
      appUrl: config.app.baseURL,
      customGreeting: emailSettings?.email_invoice_greeting || null,
      customFooterNote: emailSettings?.email_invoice_footer_note || null,
      customFooterText: emailSettings?.email_footer_text || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

export async function sendNewsletterWelcomeEmail(
  email: string,
  emailSettings?: SettingsMap,
) {
  const subject = emailSettings?.email_newsletter_subject || "Welcome to Mintax Newsletter!"

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(NewsletterWelcomeEmail, {
      customGreeting: emailSettings?.email_newsletter_greeting || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

// Re-export for backward compatibility
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return (getResend() as any)[prop]
  },
})

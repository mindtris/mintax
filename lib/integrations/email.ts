import { InvoiceEmail } from "@/components/emails/invoice-email"
import { NewsletterWelcomeEmail } from "@/components/emails/newsletter-welcome-email"
import { OTPEmail } from "@/components/emails/otp-email"
import { ReminderEmail } from "@/components/emails/reminder-email"
import React from "react"
import { Resend } from "resend"
import nodemailer from "nodemailer"
import config from "@/lib/core/config"

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
}: {
  to: string
  subject: string
  react: React.ReactElement
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
// Email functions
// ─────────────────────────────────────────────────────────────────────────────

export async function sendOTPCodeEmail({ email, otp }: { email: string; otp: string }) {
  return sendEmail({
    to: email,
    subject: "Your Mintax verification code",
    react: React.createElement(OTPEmail, { otp }),
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
}: {
  email: string
  reminderTitle: string
  description?: string | null
  dueAt: string
  category: string
  priority: string
  orgName: string
}) {
  return sendEmail({
    to: email,
    subject: `Reminder: ${reminderTitle}`,
    react: React.createElement(ReminderEmail, {
      reminderTitle,
      description,
      dueAt,
      category,
      priority,
      orgName,
      appUrl: config.app.baseURL,
    }),
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
}: {
  email: string
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  notes?: string | null
}) {
  return sendEmail({
    to: email,
    subject: `Invoice ${invoiceNumber} from ${orgName}`,
    react: React.createElement(InvoiceEmail, {
      invoiceNumber,
      clientName,
      total,
      currency,
      dueDate,
      orgName,
      notes,
      appUrl: config.app.baseURL,
    }),
  })
}

export async function sendNewsletterWelcomeEmail(email: string) {
  return sendEmail({
    to: email,
    subject: "Welcome to Mintax Newsletter!",
    react: React.createElement(NewsletterWelcomeEmail),
  })
}

// Re-export for backward compatibility
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return (getResend() as any)[prop]
  },
})

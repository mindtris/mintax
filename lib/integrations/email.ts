import { BillRecurringEmail } from "@/components/emails/bill-recurring-email"
import { BillReminderEmail } from "@/components/emails/bill-reminder-email"
import { InvoiceEmail } from "@/components/emails/invoice-email"
import { InvoicePaymentEmail } from "@/components/emails/invoice-payment-email"
import { InvoiceRecurringEmail } from "@/components/emails/invoice-recurring-email"
import { InvoiceReminderEmail } from "@/components/emails/invoice-reminder-email"
import { NewsletterWelcomeEmail } from "@/components/emails/newsletter-welcome-email"
import { OTPEmail } from "@/components/emails/otp-email"
import { PaymentReceiptEmail } from "@/components/emails/payment-receipt-email"
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
// Authentication
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

// ─────────────────────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────────────────────

/** New Invoice Template (sent to customer) */
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

/** Invoice Reminder Template (sent to customer or admin) */
export async function sendInvoiceReminderEmail({
  email,
  invoiceNumber,
  clientName,
  total,
  currency,
  dueDate,
  orgName,
  status,
  recipient,
  emailSettings,
}: {
  email: string
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  status: string
  recipient: "customer" | "admin"
  emailSettings?: SettingsMap
}) {
  const vars = { invoiceNumber, orgName, clientName, status }
  const settingsKey = recipient === "customer" ? "email_invoice_reminder_customer_subject" : "email_invoice_reminder_admin_subject"
  const subject = emailSettings?.[settingsKey]
    ? interpolate(emailSettings[settingsKey], vars)
    : `Invoice ${invoiceNumber} is ${status}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(InvoiceReminderEmail, {
      invoiceNumber,
      clientName,
      total,
      currency,
      dueDate,
      orgName,
      appUrl: config.app.baseURL,
      status,
      recipient,
      customFooterNote: emailSettings?.[`email_invoice_reminder_${recipient}_footer`] || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

/** Invoice Recurring Template (sent to customer or admin) */
export async function sendInvoiceRecurringEmail({
  email,
  invoiceNumber,
  clientName,
  total,
  currency,
  dueDate,
  recurrence,
  orgName,
  recipient,
  emailSettings,
}: {
  email: string
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  recurrence: string
  orgName: string
  recipient: "customer" | "admin"
  emailSettings?: SettingsMap
}) {
  const vars = { invoiceNumber, orgName, clientName, recurrence }
  const settingsKey = recipient === "customer" ? "email_invoice_recurring_customer_subject" : "email_invoice_recurring_admin_subject"
  const subject = emailSettings?.[settingsKey]
    ? interpolate(emailSettings[settingsKey], vars)
    : `Recurring invoice ${invoiceNumber} generated`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(InvoiceRecurringEmail, {
      invoiceNumber,
      clientName,
      total,
      currency,
      dueDate,
      recurrence,
      orgName,
      appUrl: config.app.baseURL,
      recipient,
      customFooterNote: emailSettings?.[`email_invoice_recurring_${recipient}_footer`] || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

/** Invoice Payment Receipt Template (sent to customer) */
export async function sendInvoicePaymentReceiptEmail({
  email,
  invoiceNumber,
  clientName,
  total,
  currency,
  paidDate,
  orgName,
  emailSettings,
}: {
  email: string
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  paidDate: string
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { invoiceNumber, orgName, clientName }
  const subject = emailSettings?.email_invoice_payment_receipt_subject
    ? interpolate(emailSettings.email_invoice_payment_receipt_subject, vars)
    : `Payment receipt for invoice ${invoiceNumber}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(InvoicePaymentEmail, {
      invoiceNumber,
      clientName,
      total,
      currency,
      paidDate,
      orgName,
      appUrl: config.app.baseURL,
      recipient: "customer",
      customFooterNote: emailSettings?.email_invoice_payment_receipt_footer || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

/** Invoice Payment Received Template (sent to admin) */
export async function sendInvoicePaymentReceivedEmail({
  email,
  invoiceNumber,
  clientName,
  total,
  currency,
  paidDate,
  orgName,
  emailSettings,
}: {
  email: string
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  paidDate: string
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { invoiceNumber, orgName, clientName }
  const subject = emailSettings?.email_invoice_payment_received_subject
    ? interpolate(emailSettings.email_invoice_payment_received_subject, vars)
    : `Payment received for invoice ${invoiceNumber}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(InvoicePaymentEmail, {
      invoiceNumber,
      clientName,
      total,
      currency,
      paidDate,
      orgName,
      appUrl: config.app.baseURL,
      recipient: "admin",
      customFooterNote: emailSettings?.email_invoice_payment_received_footer || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Bills
// ─────────────────────────────────────────────────────────────────────────────

/** Bill Reminder Template (sent to admin) */
export async function sendBillReminderEmail({
  email,
  billNumber,
  vendorName,
  total,
  currency,
  dueDate,
  orgName,
  status,
  emailSettings,
}: {
  email: string
  billNumber: string
  vendorName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  status: string
  emailSettings?: SettingsMap
}) {
  const vars = { billNumber, vendorName, orgName, status }
  const subject = emailSettings?.email_bill_reminder_subject
    ? interpolate(emailSettings.email_bill_reminder_subject, vars)
    : `Bill ${billNumber} from ${vendorName} is ${status}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(BillReminderEmail, {
      billNumber,
      vendorName,
      total,
      currency,
      dueDate,
      orgName,
      appUrl: config.app.baseURL,
      status,
      customFooterNote: emailSettings?.email_bill_reminder_footer || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

/** Bill Recurring Template (sent to admin) */
export async function sendBillRecurringEmail({
  email,
  billName,
  total,
  currency,
  recurrence,
  orgName,
  emailSettings,
}: {
  email: string
  billName: string
  total: string
  currency: string
  recurrence: string
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { billName, orgName, recurrence }
  const subject = emailSettings?.email_bill_recurring_subject
    ? interpolate(emailSettings.email_bill_recurring_subject, vars)
    : `Recurring expense processed: ${billName}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(BillRecurringEmail, {
      billName,
      total,
      currency,
      recurrence,
      orgName,
      appUrl: config.app.baseURL,
      customFooterNote: emailSettings?.email_bill_recurring_footer || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────────────────────────────────────

/** Payment Receipt Template (sent to customer) */
export async function sendPaymentReceiptEmail({
  email,
  referenceNumber,
  recipientName,
  total,
  currency,
  paidDate,
  paymentMethod,
  orgName,
  emailSettings,
}: {
  email: string
  referenceNumber: string
  recipientName: string
  total: string
  currency: string
  paidDate: string
  paymentMethod?: string | null
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { referenceNumber, recipientName, orgName }
  const subject = emailSettings?.email_payment_receipt_subject
    ? interpolate(emailSettings.email_payment_receipt_subject, vars)
    : `Payment receipt from ${orgName}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(PaymentReceiptEmail, {
      referenceNumber,
      recipientName,
      total,
      currency,
      paidDate,
      paymentMethod,
      orgName,
      appUrl: config.app.baseURL,
      recipient: "customer",
      customFooterNote: emailSettings?.email_payment_receipt_footer || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

/** Payment Made Template (sent to vendor) */
export async function sendPaymentMadeEmail({
  email,
  referenceNumber,
  vendorName,
  total,
  currency,
  paidDate,
  paymentMethod,
  orgName,
  emailSettings,
}: {
  email: string
  referenceNumber: string
  vendorName: string
  total: string
  currency: string
  paidDate: string
  paymentMethod?: string | null
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { referenceNumber, vendorName, orgName }
  const subject = emailSettings?.email_payment_made_subject
    ? interpolate(emailSettings.email_payment_made_subject, vars)
    : `Payment sent to ${vendorName}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(PaymentReceiptEmail, {
      referenceNumber,
      recipientName: vendorName,
      total,
      currency,
      paidDate,
      paymentMethod,
      orgName,
      appUrl: config.app.baseURL,
      recipient: "vendor",
      customFooterNote: emailSettings?.email_payment_made_footer || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Reminders & Newsletter
// ─────────────────────────────────────────────────────────────────────────────

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

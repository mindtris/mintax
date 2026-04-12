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
import { GenericEmail } from "@/components/emails/generic-email"
import { getEmailTemplate, interpolate } from "@/lib/services/email-templates"
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

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  attachments,
}: {
  to: string
  subject: string
  react: React.ReactElement
  replyTo?: string
  attachments?: { filename: string; content: Buffer | Uint8Array; contentType: string }[]
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
        attachments: attachments?.map(a => ({
          filename: a.filename,
          content: Buffer.from(a.content),
          contentType: a.contentType,
        })),
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
        attachments: attachments?.map(a => ({
          filename: a.filename,
          content: Buffer.from(a.content),
        })),
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
  orgId,
  email,
  invoiceNumber,
  clientName,
  total,
  currency,
  dueDate,
  orgName,
  notes,
  emailSettings,
  pdfAttachment,
}: {
  orgId: string
  email: string
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  notes?: string | null
  emailSettings?: SettingsMap
  pdfAttachment?: { filename: string; content: Buffer | Uint8Array; contentType: string }
}) {
  const vars = { invoiceNumber, orgName, clientName, total, currency, dueDate }
  
  // Try to get dynamic template
  const template = await getEmailTemplate(orgId, "invoice", "sent")

  if (template) {
    const subject = interpolate(template.subject, vars)
    const greeting = interpolate(template.greeting, vars)
    const body = interpolate(template.body, vars)
    const footer = interpolate(template.footer, vars)

    return sendEmail({
      to: email,
      subject,
      react: React.createElement(GenericEmail, {
        subject,
        greeting,
        body,
        footer,
        globalFooterText: emailSettings?.email_footer_text,
      }),
      replyTo: emailSettings?.email_reply_to || undefined,
      attachments: pdfAttachment ? [pdfAttachment] : undefined,
    })
  }

  // Fallback to legacy
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
    attachments: pdfAttachment ? [pdfAttachment] : undefined,
  })
}

/** Bill Template (sent to vendor with PDF attachment) */
export async function sendBillEmail({
  orgId,
  email,
  billNumber,
  vendorName,
  total,
  currency,
  dueDate,
  orgName,
  notes,
  emailSettings,
  pdfAttachment,
}: {
  orgId: string
  email: string
  billNumber: string
  vendorName: string
  total: string
  currency: string
  dueDate: string
  orgName: string
  notes?: string | null
  emailSettings?: SettingsMap
  pdfAttachment?: { filename: string; content: Buffer | Uint8Array; contentType: string }
}) {
  // Expose both bill-native and invoice-compatible names so templates can use either.
  const vars = {
    billNumber,
    invoiceNumber: billNumber,
    orgName,
    vendorName,
    clientName: vendorName,
    total,
    currency,
    dueDate,
  }

  // Try dynamic bill template first
  const template = await getEmailTemplate(orgId, "bill", "sent")

  if (template) {
    const subject = interpolate(template.subject, vars)
    const greeting = interpolate(template.greeting, vars)
    const body = interpolate(template.body, vars)
    const footer = interpolate(template.footer, vars)

    return sendEmail({
      to: email,
      subject,
      react: React.createElement(GenericEmail, {
        subject,
        greeting,
        body,
        footer,
        globalFooterText: emailSettings?.email_footer_text,
      }),
      replyTo: emailSettings?.email_reply_to || undefined,
      attachments: pdfAttachment ? [pdfAttachment] : undefined,
    })
  }

  // Fallback: reuse InvoiceEmail layout with bill vocabulary mapped in
  const subject = emailSettings?.email_bill_subject
    ? interpolate(emailSettings.email_bill_subject, vars)
    : `Bill ${billNumber} from ${orgName}`

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(InvoiceEmail, {
      invoiceNumber: billNumber,
      clientName: vendorName,
      total,
      currency,
      dueDate,
      orgName,
      notes,
      appUrl: config.app.baseURL,
      customGreeting: emailSettings?.email_bill_greeting || null,
      customFooterNote: emailSettings?.email_bill_footer_note || null,
      customFooterText: emailSettings?.email_footer_text || null,
    }),
    replyTo: emailSettings?.email_reply_to || undefined,
    attachments: pdfAttachment ? [pdfAttachment] : undefined,
  })
}

/** Invoice Reminder Template (sent to customer or admin) */
export async function sendInvoiceReminderEmail({
  orgId,
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
  orgId: string
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
  const vars = { invoiceNumber, orgName, clientName, status, total, currency, dueDate }
  
  const template = await getEmailTemplate(orgId, "invoice", "reminder")

  if (template) {
    const subject = interpolate(template.subject, vars)
    const greeting = interpolate(template.greeting, vars)
    const body = interpolate(template.body, vars)
    const footer = interpolate(template.footer, vars)

    return sendEmail({
      to: email,
      subject,
      react: React.createElement(GenericEmail, {
        subject,
        greeting,
        body,
        footer,
        globalFooterText: emailSettings?.email_footer_text,
      }),
      replyTo: emailSettings?.email_reply_to || undefined,
    })
  }

  // Fallback
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
  orgId,
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
  orgId: string
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
  const vars = { billNumber, vendorName, orgName, status, total, currency, dueDate }
  
  const template = await getEmailTemplate(orgId, "bill", "reminder")

  if (template) {
    const subject = interpolate(template.subject, vars)
    const greeting = interpolate(template.greeting, vars)
    const body = interpolate(template.body, vars)
    const footer = interpolate(template.footer, vars)

    return sendEmail({
      to: email,
      subject,
      react: React.createElement(GenericEmail, {
        subject,
        greeting,
        body,
        footer,
        globalFooterText: emailSettings?.email_footer_text,
      }),
      replyTo: emailSettings?.email_reply_to || undefined,
    })
  }

  // Fallback
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

// ─────────────────────────────────────────────────────────────────────────────
// Estimates
// ─────────────────────────────────────────────────────────────────────────────

export async function sendEstimateEmail({
  orgId,
  email,
  estimateNumber,
  clientName,
  total,
  currency,
  orgName,
  emailSettings,
}: {
  orgId: string
  email: string
  estimateNumber: string
  clientName: string
  total: string
  currency: string
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { estimateNumber, orgName, clientName, total, currency }
  const template = await getEmailTemplate(orgId, "estimate", "sent")

  if (template) {
    const subject = interpolate(template.subject, vars)
    const greeting = interpolate(template.greeting, vars)
    const body = interpolate(template.body, vars)
    const footer = interpolate(template.footer, vars)

    return sendEmail({
      to: email,
      subject,
      react: React.createElement(GenericEmail, {
        subject,
        greeting,
        body,
        footer,
        globalFooterText: emailSettings?.email_footer_text,
      }),
      replyTo: emailSettings?.email_reply_to || undefined,
    })
  }

  // Fallback (Estimate uses same layout as Invoice for now)
  return sendEmail({
    to: email,
    subject: `Estimate ${estimateNumber} from ${orgName}`,
    react: React.createElement(InvoiceEmail, {
      invoiceNumber: estimateNumber,
      clientName,
      total,
      currency,
      dueDate: "",
      orgName,
      appUrl: config.app.baseURL,
    } as any),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Leads & Pipeline
// ─────────────────────────────────────────────────────────────────────────────

export async function sendLeadAssignmentEmail({
  orgId,
  email,
  leadName,
  source,
  assigneeName,
  orgName,
  emailSettings,
}: {
  orgId: string
  email: string
  leadName: string
  source: string
  assigneeName: string
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { leadName, source, assigneeName, orgName }
  const template = await getEmailTemplate(orgId, "lead", "assigned")

  if (template) {
    const subject = interpolate(template.subject, vars)
    const greeting = interpolate(template.greeting, vars)
    const body = interpolate(template.body, vars)
    const footer = interpolate(template.footer, vars)

    return sendEmail({
      to: email,
      subject,
      react: React.createElement(GenericEmail, {
        subject,
        greeting,
        body,
        footer,
        globalFooterText: emailSettings?.email_footer_text,
      }),
      replyTo: emailSettings?.email_reply_to || undefined,
    })
  }

  return sendEmail({
    to: email,
    subject: `New Lead Assigned: ${leadName}`,
    react: React.createElement(GenericEmail, {
      subject: `New Lead Assigned: ${leadName}`,
      greeting: `Hello ${assigneeName},`,
      body: `A new lead '${leadName}' from ${source} has been assigned to you.`,
      globalFooterText: emailSettings?.email_footer_text,
    }),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Hire & HR
// ─────────────────────────────────────────────────────────────────────────────

export async function sendHireApplicationConfirmationEmail({
  orgId,
  email,
  applicantName,
  jobTitle,
  orgName,
  emailSettings,
}: {
  orgId: string
  email: string
  applicantName: string
  jobTitle: string
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { applicantName, jobTitle, orgName }
  const template = await getEmailTemplate(orgId, "hire", "application_received")

  if (template) {
    const subject = interpolate(template.subject, vars)
    const greeting = interpolate(template.greeting, vars)
    const body = interpolate(template.body, vars)
    const footer = interpolate(template.footer, vars)

    return sendEmail({
      to: email,
      subject,
      react: React.createElement(GenericEmail, {
        subject,
        greeting,
        body,
        footer,
        globalFooterText: emailSettings?.email_footer_text,
      }),
      replyTo: emailSettings?.email_reply_to || undefined,
    })
  }

  return sendEmail({
    to: email,
    subject: `Application received: ${jobTitle} at ${orgName}`,
    react: React.createElement(GenericEmail, {
      subject: `Application received: ${jobTitle} at ${orgName}`,
      greeting: `Hi ${applicantName},`,
      body: `Thank you for applying for the ${jobTitle} position. We have received your application and will review it shortly.`,
      globalFooterText: emailSettings?.email_footer_text,
    }),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Team & Organization
// ─────────────────────────────────────────────────────────────────────────────

export async function sendTeamInvitationEmail({
  orgId,
  email,
  inviterName,
  orgName,
  emailSettings,
}: {
  orgId: string
  email: string
  inviterName: string
  orgName: string
  emailSettings?: SettingsMap
}) {
  const vars = { inviterName, orgName }
  const template = await getEmailTemplate(orgId, "team", "invite")

  if (template) {
    const subject = interpolate(template.subject, vars)
    const greeting = interpolate(template.greeting, vars)
    const body = interpolate(template.body, vars)
    const footer = interpolate(template.footer, vars)

    return sendEmail({
      to: email,
      subject,
      react: React.createElement(GenericEmail, {
        subject,
        greeting,
        body,
        footer,
        globalFooterText: emailSettings?.email_footer_text,
      }),
      replyTo: emailSettings?.email_reply_to || undefined,
    })
  }

  return sendEmail({
    to: email,
    subject: `Invitation to join ${orgName} on Mintax`,
    react: React.createElement(GenericEmail, {
      subject: `Invitation to join ${orgName} on Mintax`,
      greeting: `Hi there!`,
      body: `${inviterName} has invited you to join the ${orgName} team on Mintax.`,
      globalFooterText: emailSettings?.email_footer_text,
    }),
  })
}

// Re-export for backward compatibility
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return (getResend() as any)[prop]
  },
})

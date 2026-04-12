import { randomHexColor } from "@/lib/utils"
import { z } from "zod"

export const settingsFormSchema = z.object({
  default_currency: z.string().max(5).optional(),
  default_type: z.string().optional(),
  default_category: z.string().optional(),
  default_project: z.string().optional(),
  openai_api_key: z.string().optional(),
  openai_model_name: z.string().default('gpt-4o-mini'),
  google_api_key: z.string().optional(),
  google_model_name: z.string().default("gemini-2.5-flash"),
  mistral_api_key: z.string().optional(),
  mistral_model_name: z.string().default("mistral-medium-latest"),
  openai_compatible_api_key: z.string().optional(),
  openai_compatible_model_name: z.string().optional(),
  openai_compatible_base_url: z.string().optional(),
  llm_providers: z.string().default('openai,google,mistral,openai_compatible'),
  prompt_analyse_new_file: z.string().optional(),
  is_welcome_message_hidden: z.string().optional(),
  bill_prefix: z.string().optional(),
  bill_default_due_days: z.string().optional(),
  bill_default_category: z.string().optional(),
})

export const currencyFormSchema = z.object({
  code: z.string().max(5),
  name: z.string().max(32),
})

export const projectFormSchema = z.object({
  name: z.string().max(128),
  llm_prompt: z.string().max(512).nullable().optional(),
  color: z.string().max(7).default(randomHexColor()).nullable().optional(),
})

export const categoryFormSchema = z.object({
  name: z.string().max(128),
  type: z.string().default("transaction"),
  llm_prompt: z.string().max(512).nullable().optional(),
  color: z.string().max(7).default(randomHexColor()).nullable().optional(),
  parentId: z.string().nullable().optional(),
})

export const invoiceSettingsSchema = z.object({
  invoice_template: z.string().max(64).optional(),
  invoice_number_prefix: z.string().max(10).optional(),
  invoice_number_digits: z.string().optional(),
  invoice_payment_terms: z.string().optional(),
  invoice_title: z.string().max(128).optional(),
  invoice_subheading: z.string().max(256).optional(),
  invoice_notes: z.string().max(2000).optional(),
  invoice_footer: z.string().max(1000).optional(),
  invoice_color: z.string().max(7).optional(),
  invoice_auto_send: z.string().optional(),
  invoice_item_label: z.string().max(64).optional(),
  invoice_price_label: z.string().max(64).optional(),
  invoice_quantity_label: z.string().max(64).optional(),
  invoice_hide_item_description: z.string().optional(),
})

export const estimateSettingsSchema = z.object({
  estimate_template: z.string().max(20).optional(),
  estimate_number_prefix: z.string().max(10).optional(),
  estimate_number_digits: z.string().optional(),
  estimate_validity_days: z.string().optional(),
  estimate_title: z.string().max(128).optional(),
  estimate_subheading: z.string().max(256).optional(),
  estimate_notes: z.string().max(2000).optional(),
  estimate_footer: z.string().max(1000).optional(),
  estimate_color: z.string().max(7).optional(),
  estimate_item_label: z.string().max(64).optional(),
  estimate_price_label: z.string().max(64).optional(),
  estimate_quantity_label: z.string().max(64).optional(),
  estimate_hide_item_description: z.string().optional(),
})

export const emailTemplateSettingsSchema = z.object({
  // Global
  email_sender_name: z.string().max(128).optional(),
  email_reply_to: z.string().max(256).optional(),
  email_footer_text: z.string().max(512).optional(),
  // Bills
  email_bill_reminder_subject: z.string().max(256).optional(),
  email_bill_reminder_footer: z.string().max(512).optional(),
  email_bill_recurring_subject: z.string().max(256).optional(),
  email_bill_recurring_footer: z.string().max(512).optional(),
  // Invoices — new invoice
  email_invoice_subject: z.string().max(256).optional(),
  email_invoice_greeting: z.string().max(512).optional(),
  email_invoice_footer_note: z.string().max(512).optional(),
  // Invoices — reminder (customer + admin)
  email_invoice_reminder_customer_subject: z.string().max(256).optional(),
  email_invoice_reminder_customer_footer: z.string().max(512).optional(),
  email_invoice_reminder_admin_subject: z.string().max(256).optional(),
  email_invoice_reminder_admin_footer: z.string().max(512).optional(),
  // Invoices — recurring (customer + admin)
  email_invoice_recurring_customer_subject: z.string().max(256).optional(),
  email_invoice_recurring_customer_footer: z.string().max(512).optional(),
  email_invoice_recurring_admin_subject: z.string().max(256).optional(),
  email_invoice_recurring_admin_footer: z.string().max(512).optional(),
  // Invoices — payment
  email_invoice_payment_receipt_subject: z.string().max(256).optional(),
  email_invoice_payment_receipt_footer: z.string().max(512).optional(),
  email_invoice_payment_received_subject: z.string().max(256).optional(),
  email_invoice_payment_received_footer: z.string().max(512).optional(),
  // Payments
  email_payment_receipt_subject: z.string().max(256).optional(),
  email_payment_receipt_footer: z.string().max(512).optional(),
  email_payment_made_subject: z.string().max(256).optional(),
  email_payment_made_footer: z.string().max(512).optional(),
  // Reminders & Others
  email_reminder_subject: z.string().max(256).optional(),
  email_reminder_footer_note: z.string().max(512).optional(),
  email_otp_subject: z.string().max(256).optional(),
  email_newsletter_subject: z.string().max(256).optional(),
  email_newsletter_greeting: z.string().max(512).optional(),
})

export const emailTemplateFormSchema = z.object({
  id: z.string().uuid().optional(),
  module: z.string().min(1, "Module is required"),
  event: z.string().min(1, "Event is required"),
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  greeting: z.string().nullable().optional(),
  body: z.string().min(1, "Body is required"),
  footer: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const fieldFormSchema = z.object({
  name: z.string().max(128),
  type: z.string().max(128).default("string"),
  llm_prompt: z.string().max(512).nullable().optional(),
  isVisibleInList: z.boolean().optional(),
  isVisibleInAnalysis: z.boolean().optional(),
  isRequired: z.boolean().optional(),
})

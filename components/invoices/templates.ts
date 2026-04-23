import { SettingsMap } from "@/lib/services/settings"
import { Organization } from "@/lib/prisma/client"
import { addDays, format } from "date-fns"
import { InvoiceFormData } from "./types"

export interface InvoiceTemplate {
  id?: string
  name: string
  formData: InvoiceFormData
}

export default function defaultTemplates(org: Organization, settings: SettingsMap): InvoiceTemplate[] {
  const paymentTerms = parseInt(settings.invoice_payment_terms || "30") || 30

  const defaultTemplate: InvoiceFormData = {
    title: settings.invoice_title || "INVOICE",
    businessLogo: org.logo,
    invoiceNumber: `${settings.invoice_prefix || "INV-"}${format(new Date(), "yyyyMMdd")}`,
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), paymentTerms), "yyyy-MM-dd"),
    currency: settings.default_currency || org.baseCurrency || "INR",
    companyDetails: `${org.name}\n${org.address || ""}${settings.invoice_tax_id ? `\nTax ID: ${settings.invoice_tax_id}` : ""}`,
    companyDetailsLabel: settings.invoice_bill_from_label || "Bill From",
    billTo: "",
    billToLabel: settings.invoice_bill_to_label || "Bill To",
    items: [{ name: "", subtitle: "", showSubtitle: false, quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }],
    taxIncluded: settings.invoice_tax_included === "true",
    additionalTaxes: settings.invoice_tax_rate ? [
      { name: settings.invoice_tax_name || "Tax", rate: parseFloat(settings.invoice_tax_rate), amount: 0 }
    ] : [],
    additionalFees: [],
    notes: settings.invoice_notes || "",
    bankDetails: settings.invoice_bank_details || org.bankDetails || "",
    issueDateLabel: settings.invoice_date_label || "Issue Date",
    dueDateLabel: settings.invoice_due_date_label || "Due Date",
    itemLabel: settings.invoice_item_label || "Item",
    quantityLabel: settings.invoice_quantity_label || "Quantity",
    unitPriceLabel: settings.invoice_price_label || "Unit Price",
    subtotalLabel: settings.invoice_subtotal_label || "Subtotal",
    summarySubtotalLabel: settings.invoice_subtotal_label ? `${settings.invoice_subtotal_label}:` : "Subtotal:",
    summaryTotalLabel: settings.invoice_total_label ? `${settings.invoice_total_label}:` : "Total:",
  }

  return [
    { name: "Default", formData: defaultTemplate },
  ]
}

/**
 * Convert a saved invoice (from sales module) into the InvoiceFormData shape
 * for PDF preview/export, using invoice settings for labels and styling.
 */
export function invoiceToFormData(
  invoice: {
    invoiceNumber: string
    clientName: string
    clientEmail?: string | null
    clientAddress?: string | null
    clientTaxId?: string | null
    total: number
    subtotal: number
    taxTotal: number
    currency: string
    issuedAt?: string | null | Date
    dueAt?: string | null | Date
    notes?: string | null
    subject?: string | null
    description?: string | null
    items?: any[]
  },
  org: Organization,
  settings: SettingsMap
): InvoiceFormData {
  const items = (invoice.items || []).map((item: any) => ({
    name: item.name || "",
    subtitle: item.description || "",
    showSubtitle: !!item.description,
    quantity: item.quantity || 1,
    unitPrice: (item.price || 0) / 100,
    discount: 0,
    subtotal: ((item.price || 0) * (item.quantity || 1)) / 100,
  }))

  // If no items, create one from the totals
  if (items.length === 0) {
    items.push({
      name: "Services",
      subtitle: "",
      showSubtitle: false,
      quantity: 1,
      unitPrice: invoice.subtotal / 100,
      discount: 0,
      subtotal: invoice.subtotal / 100,
    })
  }

  const taxAmount = invoice.taxTotal / 100

  return {
    title: settings.invoice_title || "INVOICE",
    businessLogo: org.logo,
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.issuedAt ? format(new Date(invoice.issuedAt), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    dueDate: invoice.dueAt ? format(new Date(invoice.dueAt), "yyyy-MM-dd") : "",
    currency: invoice.currency || org.baseCurrency || "INR",
    companyDetails: `${org.name}\n${org.address || ""}${settings.invoice_tax_id ? `\nTax ID: ${settings.invoice_tax_id}` : ""}`,
    companyDetailsLabel: "Bill From",
    billTo: [invoice.clientName, invoice.clientEmail, invoice.clientAddress, invoice.clientTaxId ? `Tax ID: ${invoice.clientTaxId}` : ""].filter(Boolean).join("\n"),
    billToLabel: "Bill To",
    items,
    taxIncluded: false,
    additionalTaxes: taxAmount > 0 ? [{ name: "Tax", rate: 0, amount: taxAmount }] : [],
    additionalFees: [],
    notes: invoice.notes || settings.invoice_notes || "",
    bankDetails: settings.invoice_bank_details || org.bankDetails || "",
    issueDateLabel: "Issue Date",
    dueDateLabel: "Due Date",
    itemLabel: settings.invoice_item_label || "Item",
    quantityLabel: settings.invoice_quantity_label || "Quantity",
    unitPriceLabel: settings.invoice_price_label || "Unit Price",
    subtotalLabel: "Subtotal",
    summarySubtotalLabel: "Subtotal:",
    summaryTotalLabel: "Total:",
    subject: invoice.subject || "",
    description: invoice.description || "",
    // Theming

    accentColor: settings.invoice_color || "#6366f1",
    template: settings.invoice_template || "default",
    footerText: settings.invoice_footer || "",
  }
}

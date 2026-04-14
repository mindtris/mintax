import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getInvoiceById } from "@/lib/services/invoices"
import { getFilesByInvoiceId } from "@/lib/services/files"
import { getSettings } from "@/lib/services/settings"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    if (!invoiceId) {
      return new NextResponse("No invoiceId provided", { status: 400 })
    }

    const [invoice, files, settings] = await Promise.all([
      getInvoiceById(invoiceId, org.id),
      getFilesByInvoiceId(invoiceId, org.id),
      getSettings(org.id),
    ])

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 })
    }

    return NextResponse.json({
      invoice,
      files,
      org: { name: org.name, logo: org.logo, address: org.address, baseCurrency: org.baseCurrency, bankDetails: org.bankDetails },
      invoiceSettings: {
        invoice_color: settings.invoice_color || "#6366f1",
        invoice_template: settings.invoice_template || "default",
        invoice_title: settings.invoice_title || "INVOICE",
        invoice_footer: settings.invoice_footer || "",
        invoice_notes: settings.invoice_notes || "",
        invoice_item_label: settings.invoice_item_label || "Item",
        invoice_quantity_label: settings.invoice_quantity_label || "Qty",
        invoice_price_label: settings.invoice_price_label || "Unit Price",
        invoice_bank_details: settings.invoice_bank_details || "",
        invoice_tax_id: settings.invoice_tax_id || "",
      },
    })
  } catch (error) {
    console.error("Error fetching invoice details:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

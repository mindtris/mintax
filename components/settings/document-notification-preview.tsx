"use client"

import { Button } from "@/components/ui/button"
import { InvoiceFormData } from "@/app/(app)/apps/invoices/components/invoice-page"
import { formatCurrency } from "@/lib/utils"
import { Mail, ShieldCheck, ExternalLink } from "lucide-react"

interface Props {
  orgName: string
  logo?: string | null
  data: InvoiceFormData
  type: "invoice" | "estimate"
}

export function DocumentNotificationPreview({ orgName, logo, data, type }: Props) {
  const documentType = type === "invoice" ? "Invoice" : "Quote"
  const documentId = data.invoiceNumber || "Draft"
  const total = data.items.reduce((sum, item) => sum + item.subtotal, 0)
  
  return (
    <div className="w-full h-full bg-[#F5F7FA] p-4 sm:p-12 overflow-y-auto font-sans">
      {/* Email Inbox Simulation Header */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center gap-3 text-muted-foreground px-2">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border">
          <Mail className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <p className="text-xs font-semibold text-foreground">Official Notification</p>
          <p className="text-[10px] tracking-tight truncate">{orgName} &lt;notifications@mintax.app&gt;</p>
        </div>
      </div>

      {/* The Email Body */}
      <div className="max-w-2xl mx-auto bg-white shadow-xl border rounded-xl overflow-hidden">
        {/* Branded Header */}
        <div className="p-8 border-b bg-white flex flex-col items-center justify-center text-center">
          {logo ? (
            <img src={logo} alt={orgName} className="h-16 w-auto object-contain mb-4" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mb-4 border border-dashed">
              <span className="text-xs text-muted-foreground font-semibold">LOGO</span>
            </div>
          )}
          <h1 className="text-xl font-bold text-foreground">{orgName}</h1>
        </div>

        {/* Message Content */}
        <div className="pt-10 pb-8 px-8 sm:px-12">
          <div className="space-y-6 text-center">
            <div className="inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
              {documentType} Received
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                You&apos;ve received an official {documentType.toLowerCase()}
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                Hello, {orgName} has generated a new {documentType.toLowerCase()} for your consideration. 
                Please review the details below.
              </p>
            </div>

            {/* Document Summary Card */}
            <div className="bg-muted/30 border rounded-2xl p-6 max-w-sm mx-auto">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Number</p>
                  <p className="text-sm font-semibold text-foreground">{documentId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(total * 100, data.currency)}</p>
                </div>
              </div>
            </div>

            {/* Primary Action */}
            <div className="pt-4 pb-2">
              <Button size="lg" className="h-12 px-10 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex gap-2 mx-auto">
                <ExternalLink className="w-4 h-4" />
                View {documentType} Details
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground pt-4 leading-relaxed border-t border-dashed">
              For security, do not share this link. This link will expire in 30 days.
              If you did not expect a document from this sender, please contact us.
            </p>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="px-8 py-6 bg-muted/20 border-t flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Verified Secure by Mintax
          </div>
          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
            This is an automated notification from Mintax powering {orgName} financial operations.
          </p>
        </div>
      </div>

      {/* Extra spacing for scroll feel */}
      <div className="h-20" />
    </div>
  )
}

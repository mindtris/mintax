"use client"

import { BlobProvider } from "@react-pdf/renderer"
import { InvoicePDF } from "./invoice-pdf"
import { InvoiceFormData } from "./types"
import { Loader2 } from "lucide-react"

/**
 * Renders a live PDF preview using @react-pdf/renderer BlobProvider.
 * This is client-only (loaded dynamically with ssr: false).
 * Always reflects the current invoice_color and invoice_template from settings.
 */
export default function PDFPreview({ data }: { data: InvoiceFormData }) {
  return (
    <BlobProvider document={<InvoicePDF data={data} />}>
      {({ url, loading, error }) => {
        if (loading) {
          return (
            <div className="h-full flex flex-col items-center justify-center gap-3" style={{ backgroundColor: "#f4f4f4" }}>
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: data.accentColor || "#6366f1" }} />
              <p className="text-sm text-gray-500 font-medium">Rendering preview…</p>
            </div>
          )
        }

        if (error) {
          return (
            <div className="h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: "#f4f4f4" }}>
              <p className="text-sm text-red-500 font-medium">Failed to render preview</p>
              <p className="text-xs text-gray-400">{error.message}</p>
            </div>
          )
        }

        return (
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-none"
            style={{ colorScheme: "light", backgroundColor: "white" }}
            title="Invoice Preview"
          />
        )
      }}
    </BlobProvider>
  )
}

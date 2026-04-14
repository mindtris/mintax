"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { FileText, Loader2 } from "lucide-react"
import { EditInvoiceForm } from "@/app/(app)/invoices/[invoiceId]/edit-invoice-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface EditInvoiceSheetProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  baseCurrency?: string
}

export function EditInvoiceSheet({
  invoiceId,
  open,
  onOpenChange,
  baseCurrency = "INR",
}: EditInvoiceSheetProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ invoice: any; files: any[]; org?: any; invoiceSettings?: any } | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    if (open && invoiceId) {
      fetchData()
    } else if (!open) {
      setData(null)
      setActiveTab("details")
    }
  }, [open, invoiceId])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-2xl w-[95vw] sm:max-w-5xl flex flex-col gap-0 p-0 overflow-hidden border border-border shadow-2xl"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <SheetHeader className="px-6 py-6 shrink-0 bg-muted/5 border-b border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="p-2 bg-primary/10 rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <SheetTitle className="text-lg font-bold tracking-tight whitespace-nowrap">
                  {loading ? "Loading..." : data?.invoice ? `Edit ${data.invoice.type === 'estimate' ? 'Estimate' : 'Invoice'} #${data.invoice.invoiceNumber}` : "Invoice Details"}
                </SheetTitle>
              </div>

              <div className="flex-1 flex justify-center">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex items-center justify-end min-w-[100px] pr-8">
                {/* Relying on default Sheet close button */}
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Fetching invoice details...</p>
              </div>
            ) : data ? (
              <>
                <TabsContent value="details" className="h-full m-0 p-0 overflow-y-auto focus-visible:ring-0">
                  <div className="px-8 py-8">
                    <EditInvoiceForm 
                      invoice={data.invoice} 
                      files={data.files} 
                      baseCurrency={baseCurrency} 
                      isSheet={true}
                      onClose={() => onOpenChange(false)}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      org={data.org}
                      invoiceSettings={data.invoiceSettings}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="h-full m-0 p-0 focus-visible:ring-0">
                  <EditInvoiceForm 
                    invoice={data.invoice} 
                    files={data.files} 
                    baseCurrency={baseCurrency} 
                    isSheet={true}
                    onClose={() => onOpenChange(false)}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onlyPreview={true}
                    org={data.org}
                    invoiceSettings={data.invoiceSettings}
                  />
                </TabsContent>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Could not load invoice data.</p>
              </div>
            )}
          </div>

          <SheetFooter className="px-6 py-4 border-t flex-row items-center gap-2 shrink-0 bg-background">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="px-4"
            >
              Cancel
            </Button>
            <div className="flex-1" />
            <Button 
              type="submit"
              form="edit-invoice-form"
              name="intent"
              value="send"
              variant="outline"
              className="border-primary/20 hover:bg-primary/5 hover:text-primary"
            >
              Send to client
            </Button>
            <Button 
              type="submit" 
              form="edit-invoice-form"
              className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/10"
            >
              Save changes
            </Button>
          </SheetFooter>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

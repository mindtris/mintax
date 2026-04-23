import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormAvatar, FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Currency } from "@/lib/prisma/client"
import { CheckCircle2, FileText, Mail, Quote, Search, Filter, Columns3, X, Megaphone, Plus, Loader2, Send, Pencil, Eye, ShieldCheck } from "lucide-react"
import { InputHTMLAttributes, memo, useCallback, useMemo } from "react"
import { Logo } from "@/components/ui/logo"
import { DatePicker } from "@/components/ui/date-picker"

export interface InvoiceItem {
  name: string
  subtitle: string
  showSubtitle: boolean
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

export interface AdditionalTax {
  name: string
  rate: number
  amount: number
}

export interface AdditionalFee {
  name: string
  amount: number
}

export interface InvoiceFormData {
  title: string
  subject: string
  description: string
  businessLogo: string | null
  invoiceNumber: string
  date: string
  dueDate: string
  currency: string
  companyDetails: string
  companyDetailsLabel: string
  billTo: string
  billToLabel: string
  items: InvoiceItem[]
  taxIncluded: boolean
  additionalTaxes: AdditionalTax[]
  additionalFees: AdditionalFee[]
  notes: string
  bankDetails: string
  issueDateLabel: string
  dueDateLabel: string
  itemLabel: string
  quantityLabel: string
  unitPriceLabel: string
  discountLabel: string
  subtotalLabel: string
  summarySubtotalLabel: string
  summaryTotalLabel: string
}

interface InvoicePageProps {
  invoiceData: InvoiceFormData
  dispatch: React.Dispatch<any>
  currencies: Currency[]
  readOnly?: boolean
}

// Memoized row for invoice items
const ItemRow = memo(function ItemRow({
  item,
  index,
  onRemove,
  currency,
  readOnly,
}: {
  item: InvoiceItem
  index: number
  onChange: (index: number, field: keyof InvoiceItem, value: string | number | boolean) => void
  onRemove: (index: number) => void
  currency: string
  readOnly?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center py-4 px-4 bg-white border-b border-border/50">
      {/* Index */}
      <div className="w-8 text-[11px] font-bold text-muted-foreground/60">{index + 1}</div>

      {/* Item name and subtitle */}
      <div className="flex-1 sm:px-4 w-full sm:w-auto">
        <div className="flex flex-col gap-0.5">
          <ShadyFormInput
            type="text"
            value={item.name}
            onChange={(e) => onChange(index, "name", e.target.value)}
            className="w-full min-w-0 font-bold text-sm text-foreground"
            placeholder="Item name"
            required
            readOnly={readOnly}
          />
          {item.subtitle || !readOnly ? (
            <ShadyFormInput
              type="text"
              value={item.subtitle}
              onChange={(e) => onChange(index, "subtitle", e.target.value)}
              className="w-full text-[11px] text-muted-foreground leading-snug"
              placeholder="Add description"
              readOnly={readOnly}
            />
          ) : null}
        </div>
      </div>

      {/* Numerical Columns - Flattened to match header */}
      <div className="w-16 flex flex-col items-center mt-2 sm:mt-0 px-1">
        {readOnly ? (
          <div className="text-sm font-semibold">{item.quantity}</div>
        ) : (
          <FormInput
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onChange(index, "quantity", Number(e.target.value))}
            className="w-full text-center h-8 text-xs px-1"
            required
          />
        )}
        <span className="text-[9px] text-muted-foreground/60 font-bold uppercase mt-0.5">Nos</span>
      </div>

      <div className="w-24 mt-2 sm:mt-0 px-1 text-right">
        {readOnly ? (
          <div className="text-sm font-medium">{formatCurrency(item.unitPrice * 100, currency)}</div>
        ) : (
          <FormInput
            type="number"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onChange(index, "unitPrice", Number(e.target.value))}
            className="w-full text-right h-8 text-xs px-1"
            required
          />
        )}
      </div>

      <div className="w-20 mt-2 sm:mt-0 px-1 text-right">
        {readOnly ? (
          <div className="text-sm font-medium">{formatCurrency(item.discount * 100, currency)}</div>
        ) : (
          <FormInput
            type="number"
            step="0.01"
            value={item.discount}
            onChange={(e) => onChange(index, "discount", Number(e.target.value))}
            className="w-full text-right h-8 text-xs px-1"
          />
        )}
      </div>

      <div className="w-24 mt-2 sm:mt-0 text-right pr-2">
        <span className="text-sm font-bold">
          {formatCurrency(item.subtotal * 100, currency)}
        </span>
      </div>

      {!readOnly && (
        <div className="w-8 flex items-center justify-center mt-2 sm:mt-0">
          <Button variant="ghost" size="icon" className="rounded-full h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onRemove(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
})

// Memoized row for additional taxes
const TaxRow = memo(function TaxRow({
  tax,
  index,
  onRemove,
  currency,
  readOnly,
}: {
  tax: AdditionalTax
  index: number
  onChange: (index: number, field: keyof AdditionalTax, value: string | number) => void
  onRemove: (index: number) => void
  currency: string
  readOnly?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="w-full flex flex-row gap-2 items-center">
        {!readOnly && (
          <Button variant="destructive" className="rounded-full p-1 h-5 w-5" onClick={() => onRemove(index)}>
            <X />
          </Button>
        )}
        <ShadyFormInput
          type="text"
          value={tax.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="Tax name"
          readOnly={readOnly}
          className="flex-1"
        />
        <ShadyFormInput
          type="number"
          max="100"
          value={tax.rate}
          onChange={(e) => onChange(index, "rate", Number(e.target.value))}
          className="w-12 text-right"
          readOnly={readOnly}
        />
        <span className="text-sm text-muted-foreground mr-2">%</span>
        <span className="text-sm text-nowrap">{formatCurrency(tax.amount * 100, currency)}</span>
      </div>
    </div>
  )
})

// Memoized row for additional fees
const FeeRow = memo(function FeeRow({
  fee,
  index,
  onRemove,
  currency,
  readOnly,
}: {
  fee: AdditionalFee
  index: number
  onChange: (index: number, field: keyof AdditionalFee, value: string | number) => void
  onRemove: (index: number) => void
  currency: string
  readOnly?: boolean
}) {
  return (
    <div className="w-full flex justify-between items-center">
      <div className="w-full flex flex-row gap-2 items-center justify-between">
        {!readOnly && (
          <Button variant="destructive" className="rounded-full p-1 h-5 w-5" onClick={() => onRemove(index)}>
            <X />
          </Button>
        )}
        <ShadyFormInput
          type="text"
          value={fee.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="Fee or discount name"
          readOnly={readOnly}
          className="flex-1"
        />
        <ShadyFormInput
          type="number"
          step="0.01"
          value={fee.amount}
          onChange={(e) => onChange(index, "amount", Number(e.target.value))}
          className="w-16 text-right"
          readOnly={readOnly}
        />
        <span className="text-sm text-nowrap ml-2">{formatCurrency(fee.amount * 100, currency)}</span>
      </div>
    </div>
  )
})

export function InvoicePage({ invoiceData, dispatch, currencies, readOnly = false }: InvoicePageProps) {
  const addItem = useCallback(() => dispatch({ type: "ADD_ITEM" }), [dispatch])
  const removeItem = useCallback((index: number) => dispatch({ type: "REMOVE_ITEM", index }), [dispatch])
  const updateItem = useCallback(
    (index: number, field: keyof InvoiceItem, value: string | number | boolean) =>
      dispatch({ type: "UPDATE_ITEM", index, field, value }),
    [dispatch]
  )

  const addAdditionalTax = useCallback(() => dispatch({ type: "ADD_TAX" }), [dispatch])
  const removeAdditionalTax = useCallback((index: number) => dispatch({ type: "REMOVE_TAX", index }), [dispatch])
  const updateAdditionalTax = useCallback(
    (index: number, field: keyof AdditionalTax, value: string | number) =>
      dispatch({ type: "UPDATE_TAX", index, field, value }),
    [dispatch]
  )

  const addAdditionalFee = useCallback(() => dispatch({ type: "ADD_FEE" }), [dispatch])
  const removeAdditionalFee = useCallback((index: number) => dispatch({ type: "REMOVE_FEE", index }), [dispatch])
  const updateAdditionalFee = useCallback(
    (index: number, field: keyof AdditionalFee, value: string | number) =>
      dispatch({ type: "UPDATE_FEE", index, field, value }),
    [dispatch]
  )

  const subtotal = useMemo(() => invoiceData.items.reduce((sum, item) => sum + item.subtotal, 0), [invoiceData.items])
  const taxes = useMemo(
    () => invoiceData.additionalTaxes.reduce((sum, tax) => sum + tax.amount, 0),
    [invoiceData.additionalTaxes]
  )
  const fees = useMemo(
    () => invoiceData.additionalFees.reduce((sum, fee) => sum + fee.amount, 0),
    [invoiceData.additionalFees]
  )
  const total = useMemo(
    () => (invoiceData.taxIncluded ? subtotal : subtotal + taxes) + fees,
    [invoiceData.taxIncluded, subtotal, taxes, fees]
  )

  return (
    <div className={`relative flex flex-col w-full max-w-[880px] sm:w-[880px] min-h-[1050px] bg-white p-2 sm:p-10 mx-auto border border-border ${readOnly ? "rounded-2xl shadow-sm" : "rounded-sm mb-8"}`}>
      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-10 relative">
        <div className="flex flex-col gap-2 text-sm">
          {/* Business Logo */}
          <div className="relative max-w-[100px] sm:max-w-[140px] max-h-[60px] sm:max-h-[80px]">
            <img 
              src={invoiceData.businessLogo || "/logo/logo.svg"} 
              alt="Business Logo" 
              className="w-full h-full object-contain object-left"
            />
          </div>

          <div className="text-muted-foreground leading-relaxed">
            {readOnly ? (
              <div className="whitespace-pre-wrap">{invoiceData.companyDetails}</div>
            ) : (
              <FormTextarea
                value={invoiceData.companyDetails}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "companyDetails", value: e.target.value })}
                rows={4}
                placeholder="Address & Details"
                className="w-full"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1">
          <ShadyFormInput
            type="text"
            value={invoiceData.title}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "title", value: e.target.value })}
            className="text-4xl sm:text-5xl font-semibold tracking-tight text-primary sm:text-right"
            placeholder="Invoice"
            required
            readOnly={readOnly}
          />
          <div className="flex items-center gap-1 sm:justify-end text-muted-foreground font-medium text-sm">
            <span>#</span>
            <ShadyFormInput
              placeholder="INV-17"
              value={invoiceData.invoiceNumber}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "invoiceNumber", value: e.target.value })}
              className="w-[100px]"
              readOnly={readOnly}
            />
          </div>
          
          <div className="mt-4 flex flex-col items-start sm:items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right w-full">Balance Due</span>
            <span className="text-xl font-extrabold text-foreground">
              {formatCurrency(total * 100, invoiceData.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Company and Bill To + Metadata Row */}
      <div className="relative flex justify-between gap-8 mb-10">
        <div className="flex-1 flex flex-col gap-1">
          <ShadyFormInput
            type="text"
            value={invoiceData.billToLabel}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "billToLabel", value: e.target.value })}
            className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
            readOnly={readOnly}
          />
          <div className="text-sm font-bold text-foreground mb-1 leading-tight">
             <ShadyFormInput
               type="text"
               value={invoiceData.billTo?.split('\n')[0] || ""}
               onChange={(e) => {
                 const lines = invoiceData.billTo?.split('\n') || []
                 lines[0] = e.target.value
                 dispatch({ type: "UPDATE_FIELD", field: "billTo", value: lines.join('\n') })
               }}
               readOnly={readOnly}
             />
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {readOnly ? (
              invoiceData.billTo?.split('\n').slice(1).join('\n')
            ) : (
              <FormTextarea
                value={invoiceData.billTo?.split('\n').slice(1).join('\n')}
                onChange={(e) => {
                  const lines = invoiceData.billTo?.split('\n') || []
                  dispatch({ type: "UPDATE_FIELD", field: "billTo", value: lines[0] + '\n' + e.target.value })
                }}
                rows={3}
                className="w-full text-xs"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 items-end">
            {[
              { label: invoiceData.issueDateLabel || "Invoice Date", value: invoiceData.date || "" },
              { label: "Terms", value: "Due on Receipt" },
              { label: invoiceData.dueDateLabel || "Due Date", value: invoiceData.dueDate || "" },
              { label: invoiceData.currencyLabel || "Currency", value: invoiceData.currency },
              { label: "P.O.#", value: "SO-17" }
            ].map((item, i) => (
              <div key={i} className="grid grid-cols-[100px_auto_100px] gap-2 text-xs items-center">
                <span className="text-right text-muted-foreground font-medium">{item.label}</span>
                <span className="text-muted-foreground/30">:</span>
                <span className="text-left font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Subject and Description - Grouped tightly */}
      <div className="mb-5 flex flex-col gap-1.5">
        <div className="flex flex-col gap-0">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Subject :</span>
          <ShadyFormInput
            type="text"
            value={invoiceData.subject}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "subject", value: e.target.value })}
            placeholder="e.g. Project Delivery - Q1 2026"
            className="text-[15px] font-bold text-foreground bg-transparent p-0"
            readOnly={readOnly}
          />
        </div>
        <div className="flex flex-col gap-0">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Description :</span>
          <div className="text-[13px] text-muted-foreground leading-relaxed">
            {readOnly ? (
              <div className="whitespace-pre-wrap">{invoiceData.description}</div>
            ) : (
              <FormTextarea
                value={invoiceData.description}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "description", value: e.target.value })}
                placeholder="Additional context about this invoice..."
                className="w-full text-[13px] p-0 border-none bg-transparent"
                rows={2}
              />
            )}
          </div>
        </div>
      </div>

      {/* Items Section - Refactored to use rounded container */}
      <div className="mb-8 border border-border rounded-xl overflow-hidden">
          {/* Header row for column titles */}
          <div className="hidden sm:flex bg-primary text-[10px] font-bold text-primary-foreground uppercase tracking-widest px-4 py-3.5">
            <div className="w-8">#</div>
            <div className="flex-1 sm:px-4 text-left">
              <ShadyFormInput
                type="text"
                value={invoiceData.itemLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "itemLabel", value: e.target.value })}
                className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest"
                readOnly={readOnly}
              />
            </div>
            <div className="w-16 text-center">
              <ShadyFormInput
                type="text"
                value={invoiceData.quantityLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "quantityLabel", value: e.target.value })}
                className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest text-center w-full"
                readOnly={readOnly}
              />
            </div>
            <div className="w-24 text-right">
              <ShadyFormInput
                type="text"
                value={invoiceData.unitPriceLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "unitPriceLabel", value: e.target.value })}
                className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest text-right w-full"
                readOnly={readOnly}
              />
            </div>
            <div className="w-20 text-right">
              <ShadyFormInput
                type="text"
                value={invoiceData.discountLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "discountLabel", value: e.target.value })}
                className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest text-right w-full"
                readOnly={readOnly}
              />
            </div>
            <div className="w-24 text-right pr-2">
              <ShadyFormInput
                type="text"
                value={invoiceData.subtotalLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "subtotalLabel", value: e.target.value })}
                className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest text-right w-full"
                readOnly={readOnly}
              />
            </div>
            {!readOnly && <div className="w-8"></div>}
          </div>

          {/* Invoice items */}
          <div className="flex flex-col divide-y divide-border">
            {invoiceData.items.map((item, index) => (
              <ItemRow
                key={index}
                item={item}
                index={index}
                onChange={updateItem}
                onRemove={removeItem}
                currency={invoiceData.currency}
                readOnly={readOnly}
              />
            ))}
          </div>

          {!readOnly && (
            <div className="p-2 border-t bg-muted/5">
              <Button variant="ghost" size="sm" onClick={addItem} className="text-xs font-bold text-primary gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>
          )}
      </div>

      {/* Summary Section - Spine Aligned to match table columns */}
      <div className="flex justify-end mt-8 pr-1">
        <div className="flex flex-col gap-2 items-end">
           <div className="grid grid-cols-[1fr_96px] gap-8 text-sm items-center w-full">
             <span className="text-right text-muted-foreground font-medium whitespace-nowrap">Sub Total</span>
             <span className="text-right font-semibold">{formatCurrency(subtotal * 100, invoiceData.currency)}</span>
           </div>

           <div className="grid grid-cols-[1fr_96px] gap-8 text-sm items-center w-full">
             <span className="text-right text-muted-foreground font-medium whitespace-nowrap">{invoiceData.discountLabel}</span>
             <span className="text-right font-semibold">{formatCurrency(0, invoiceData.currency)}</span>
           </div>

           {invoiceData.additionalTaxes.map((tax, index) => (
             <div key={index} className="grid grid-cols-[1fr_96px] gap-8 text-[13px] items-center w-full">
               <span className="text-right text-muted-foreground font-medium whitespace-nowrap">{tax.name} ({tax.rate}%)</span>
               <span className="text-right font-medium">{formatCurrency(tax.amount * 100, invoiceData.currency)}</span>
             </div>
           ))}

           <div className="grid grid-cols-[1fr_96px] gap-8 py-2 border-y border-border/20 mt-2 items-center w-full">
             <span className="text-right text-sm font-bold uppercase tracking-wider whitespace-nowrap">Total</span>
             <span className="text-right text-sm font-bold text-primary">
               {formatCurrency(total * 100, invoiceData.currency)}
             </span>
           </div>

           <div className="grid grid-cols-[1fr_96px] gap-8 text-[13px] items-center pt-2 w-full">
             <span className="text-right underline underline-offset-4 decoration-muted-foreground/30 text-muted-foreground whitespace-nowrap">Payment Retention</span>
             <span className="text-right text-destructive font-medium">(-) {formatCurrency(0, invoiceData.currency)}</span>
           </div>
           
           <div className="grid grid-cols-[1fr_96px] gap-8 text-[13px] items-center w-full">
             <span className="text-right text-muted-foreground whitespace-nowrap">Payment Made</span>
             <span className="text-right text-destructive font-medium">(-) {formatCurrency(0, invoiceData.currency)}</span>
           </div>

           <div className="mt-4 flex gap-8 items-center min-w-[240px] justify-between">
             <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Balance Due</span>
             <span className="text-lg font-black text-foreground">
               {formatCurrency(total * 100, invoiceData.currency)}
             </span>
           </div>
        </div>
      </div>

      {/* Footer Details - Grouped tightly at bottom */}
      <div className="mt-auto pt-10 space-y-4">
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notes</h3>
          <div className="text-xs text-muted-foreground leading-relaxed">
            {readOnly ? invoiceData.notes : (
              <FormTextarea 
                value={invoiceData.notes} 
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "notes", value: e.target.value })}
                placeholder="Message for the customer..."
                className="w-full text-xs p-0 border-none bg-transparent"
                rows={4}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment Options</span>
           <div className="flex gap-2">
              <div className="px-2 py-1 bg-muted/30 rounded border border-border/50 text-[10px] font-bold text-primary tracking-widest">PAYPAL</div>
              <div className="px-2 py-1 bg-muted/30 rounded border border-border/50 text-[10px] font-bold text-primary tracking-widest">CARD</div>
           </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terms & Conditions</h3>
          <p className="text-[11px] text-muted-foreground/70 leading-normal max-w-2xl">
            Your company's Terms and Conditions will be displayed here. You can add it in the Invoice Preferences page under Settings.
          </p>
        </div>
      </div>

      {readOnly && (
        <div className="pt-8 flex justify-center opacity-30 shadow-none">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
              Powered by Mindtris (Mintax) • © 2026 Mindtris™ Inc.
            </span>
            <span className="text-xs text-muted-foreground/60 mt-1 text-center">
              You received this email because you have a Mintax account.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function ShadyFormInput({ className = "", readOnly, ...props }: { className?: string; readOnly?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  if (readOnly) {
    return <div className={`truncate ${className}`}>{props.value}</div>
  }
  return (
    <input
      className={`bg-transparent border border-transparent outline-none p-0 w-full hover:border-border hover:bg-muted focus:bg-muted hover:rounded-sm ${className}`}
      {...props}
    />
  )
}

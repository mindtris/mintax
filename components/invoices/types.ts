export interface InvoiceItem {
  name: string
  subtitle: string
  showSubtitle: boolean
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

/** Custom invoice template stored per-organization (in app data store). */
export interface InvoiceTemplate {
  id?: string
  name: string
  data?: Partial<InvoiceFormData>
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
  subject?: string
  description?: string
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
  discountLabel?: string
  subtotalLabel: string
  summarySubtotalLabel: string
  summaryTotalLabel: string
  currencyLabel?: string
  // Theming from invoice settings
  accentColor?: string
  template?: string
  footerText?: string
}

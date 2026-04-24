import { prisma } from "@/lib/core/db"

export const DEFAULT_PROMPT_ANALYSE_NEW_FILE = `You are an Elite Forensic Accountant and Data Extraction Expert. Your task is to perform a high-precision analysis of the attached document (invoice, receipt, or bill).

EXTRACT THESE FIELDS:
{fields}

ADDITIONAL TASK:
- Extract "items": A detailed array of line items found on the document.

CONTEXTUAL DATA:
1. Valid Categories: {categories}
2. Valid Projects: {projects}

EXTRACTION STANDARDS:
1. ACCURACY: If a value is ambiguous or missing, return null. NEVER hallucinate or guess.
2. TYPES: Ensure numeric fields are returned as numbers, not strings. Dates MUST be YYYY-MM-DD.
3. SEMANTIC MATCH: Map the transaction to the most logical "Category" based on the line items and merchant nature.

OUTPUT: Return ONLY a raw JSON object. No markdown backticks, no explanatory text.`

export const DEFAULT_SETTINGS = [
  {
    code: "default_currency",
    name: "Default Currency",
    description: "Don't change this setting if you already have multi-currency transactions. I won't recalculate them.",
    value: "INR",
  },
  {
    code: "default_category",
    name: "Default Category",
    description: "",
    value: "other",
  },
  {
    code: "default_project",
    name: "Default Project",
    description: "",
    value: "personal",
  },
  {
    code: "default_type",
    name: "Default Type",
    description: "",
    value: "expense",
  },
  {
    code: "prompt_analyse_new_file",
    name: "Prompt for Analyze Transaction",
    description: "Allowed variables: {fields}, {categories}, {categories.code}, {projects}, {projects.code}",
    value: DEFAULT_PROMPT_ANALYSE_NEW_FILE,
  },
  {
    code: "is_welcome_message_hidden",
    name: "Do not show welcome message on dashboard",
    description: "",
    value: "false",
  },
  {
    code: "bill_prefix",
    name: "Default Bill Prefix",
    description: "Prefix for vendor bills (e.g., BILL-)",
    value: "BILL-",
  },
  {
    code: "bill_default_due_days",
    name: "Default Bill Due Days",
    description: "Number of days after issue date when a bill is typically due",
    value: "30",
  },
  {
    code: "bill_default_category",
    name: "Default Bill Category",
    description: "Pre-selected category for new bills",
    value: "utility_bills",
  },
]

// --- Parent (module-level) categories ---

export const PARENT_CATEGORIES: Record<string, { code: string; name: string; color: string }> = {
  expense:          { code: "_mod_expense",          name: "Expenses",            color: "#ef4444" },
  income:           { code: "_mod_income",           name: "Income",              color: "#059669" },
  cogs:             { code: "_mod_cogs",             name: "Cost of goods sold",  color: "#ca8a04" },
  item:             { code: "_mod_item",             name: "Items & products",    color: "#6366f1" },
  sales:            { code: "_mod_sales",            name: "Sales pipeline",      color: "#3b82f6" },
  hire:             { code: "_mod_hire",             name: "Hiring departments",  color: "#8b5cf6" },
  hire_expense:     { code: "_mod_hire_expense",     name: "Hiring costs",        color: "#f59e0b" },
  job_type:         { code: "_mod_job_type",         name: "Job types",           color: "#10b981" },
  employment_type:  { code: "_mod_employment_type",  name: "Employment types",    color: "#3b82f6" },
  work_auth:        { code: "_mod_work_auth",        name: "Work authorization",  color: "#10b981" },
  applicant_status: { code: "_mod_applicant_status", name: "Applicant status",    color: "#94a3b8" },
  engage:           { code: "_mod_engage",           name: "Content types",       color: "#0d9488" },
  reminder:         { code: "_mod_reminder",         name: "Reminder types",      color: "#f43f5e" },
}

// --- Universal Type-Aware Categories ---

export const BUSINESS_DEFAULTS = {
  categories: {
    expense: [
      { code: "ads", name: "Advertising & promotion", color: "#ef4444", llm: "advertising, marketing, promo, facebook ads, google ads, flyers" },
      { code: "auto_vehicle", name: "Auto & vehicle", color: "#f97316", llm: "fuel, gas, vehicle repair, car insurance, parking, tolls" },
      { code: "bank_fees", name: "Bank & service fees", color: "#7e22ce", llm: "bank charges, service fees, transaction fees, interest paid" },
      { code: "capital_assets", name: "Capital assets & depreciation", color: "#1f2937", llm: "equipment purchase, machinery, depreciation, amortization" },
      { code: "childcare", name: "Childcare", color: "#ec4899", llm: "daycare, nanny, child services" },
      { code: "clothing", name: "Clothing", color: "#8b5cf6", llm: "uniforms, work clothes, apparel" },
      { code: "communication", name: "Communication", color: "#0d9488", llm: "phone, internet, mobile bill, zoom, slack" },
      { code: "donations", name: "Donations & gifts", color: "#10b981", llm: "charities, philantropy, corporate gifts" },
      { code: "education", name: "Education & training", color: "#f43f5e", llm: "trainings, books, courses, certifications" },
      { code: "entertainment", name: "Entertainment", color: "#f97316", llm: "team events, client entertainment" },
      { code: "food", name: "Food & dining", color: "#ec4899", llm: "meals, business lunch, dinner, cafe" },
      { code: "groceries", name: "Groceries", color: "#10b981", llm: "supermarket, food supplies" },
      { code: "healthcare", name: "Healthcare & medical", color: "#ec4899", llm: "medical bills, health insurance, pharmacy" },
      { code: "home_office", name: "Home office", color: "#06b6d4", llm: "office equipment at home, desk, chair, monitor" },
      { code: "insurance", name: "Insurance", color: "#1e3a8a", llm: "business insurance, liability, property insurance" },
      { code: "interest", name: "Interest & loan payments", color: "#7e22ce", llm: "loan interest, mortgage interest" },
      { code: "office_supplies", name: "Office supplies", color: "#06b6d4", llm: "stationery, paper, ink, desk supplies" },
      { code: "personal_care", name: "Personal care", color: "#ec4899", llm: "gym, salon, self care" },
      { code: "pets", name: "Pet expenses", color: "#f43f5e", llm: "veterinary, pet food, pet supplies" },
      { code: "professional_fees", name: "Professional fees", color: "#7e22ce", llm: "legal, accounting, consultancy, auditing" },
      { code: "rent_lease", name: "Rent & lease", color: "#1e3a8a", llm: "office rent, equipment lease, property lease" },
      { code: "repairs_maintenance", name: "Repairs & maintenance", color: "#b45309", llm: "equipment repair, office maintenance, cleaning" },
      { code: "salaries_wages", name: "Salaries & wages", color: "#db2777", llm: "payroll, wages, employee benefits, bonuses" },
      { code: "software", name: "Software & subscriptions", color: "#8b5cf6", llm: "saas, digital tools, icloud, adobe, microsoft" },
      { code: "shipping_expense", name: "Shipping & freight", color: "#ca8a04", llm: "courier, shipping costs, postage" },
      { code: "tax_payments", name: "Tax payments", color: "#1f2937", llm: "income tax, gst payment, vat payment" },
      { code: "transport_delivery", name: "Transport & delivery", color: "#991b1b", llm: "logistics, delivery services" },
      { code: "travel", name: "Travel", color: "#f97316", llm: "flights, hotels, airbnb, travel insurance" },
      { code: "utilities", name: "Utilities", color: "#d97706", llm: "electricity, water, gas, heating" },
      { code: "other_expense", name: "Other", color: "#1f2937", llm: "miscellaneous, general" },
    ],
    income: [
      { code: "sales_revenue", name: "Sales revenue", color: "#059669", llm: "product sales" },
      { code: "service_revenue", name: "Service revenue", color: "#059669", llm: "consulting, services, professional fees" },
      { code: "commission", name: "Commission", color: "#10b981", llm: "sales commission, affiliate income" },
      { code: "rental_income", name: "Rental income", color: "#0d9488", llm: "property rent, asset rental" },
      { code: "interest_income", name: "Interest income", color: "#059669", llm: "bank interest, investment interest" },
      { code: "royalties", name: "Royalties", color: "#059669", llm: "licensing income, ip royalties" },
      { code: "dividends", name: "Dividends", color: "#059669", llm: "stock dividends, profit distribution" },
      { code: "salary_income", name: "Salary & wages", color: "#059669", llm: "employment income, paycheck" },
      { code: "government_benefits", name: "Government benefits", color: "#10b981", llm: "subsidies, grants, welfare" },
      { code: "refunds", name: "Refunds & reimbursements", color: "#0d9488", llm: "tax refund, vendor refund" },
      { code: "other_income", name: "Other income", color: "#059669", llm: "miscellaneous" },
    ],
    cogs: [
      { code: "raw_materials", name: "Raw materials", color: "#ca8a04", llm: "manufacturing stock, parts" },
      { code: "manufacturing", name: "Manufacturing & production", color: "#ca8a04", llm: "production costs, factory costs" },
      { code: "shipping_cogs", name: "Shipping & freight", color: "#ca8a04", llm: "inbound shipping, cargo" },
      { code: "direct_labor", name: "Direct labor", color: "#ca8a04", llm: "production staff wages" },
      { code: "packaging", name: "Packaging", color: "#ca8a04", llm: "boxes, wrappers, containers" },
    ],
    item: [
      { code: "product_item", name: "Product", color: "#6366f1", llm: "physical goods" },
      { code: "service_item", name: "Service", color: "#6366f1", llm: "consultancy, work" },
      { code: "subscription_item", name: "Subscription", color: "#6366f1", llm: "recurring billing" },
      { code: "digital_product", name: "Digital product", color: "#8b5cf6", llm: "software download, ebook, course" },
    ],
    sales: [
      { code: "lead", name: "Lead", color: "#94a3b8", llm: "new prospect" },
      { code: "qualified", name: "Qualified", color: "#64748b", llm: "vetted lead" },
      { code: "proposal", name: "Proposal", color: "#3b82f6", llm: "proposal sent" },
      { code: "negotiation", name: "Negotiation", color: "#f59e0b", llm: "price talks" },
      { code: "closed_won", name: "Closed won", color: "#10b981", llm: "sale finished" },
      { code: "closed_lost", name: "Closed lost", color: "#ef4444", llm: "lost deal" },
      { code: "churned", name: "Churned", color: "#475569", llm: "lost customer" },
    ],
    hire: [
      { code: "design", name: "Design", color: "#ec4899" },
      { code: "engineering", name: "Engineering", color: "#3b82f6" },
      { code: "finance", name: "Finance", color: "#14b8a6" },
      { code: "hr", name: "Human resources", color: "#8b5cf6" },
      { code: "marketing", name: "Marketing", color: "#f97316" },
      { code: "operations", name: "Operations", color: "#6366f1" },
      { code: "sales", name: "Sales", color: "#10b981" },
      { code: "support", name: "Customer support", color: "#06b6d4" },
      { code: "legal", name: "Legal", color: "#1e3a8a" },
      { code: "product_dept", name: "Product", color: "#8b5cf6" },
    ],
    hire_expense: [
      { code: "job_boards", name: "Job board fees", color: "#ef4444", llm: "linkedin ads, indeed postings" },
      { code: "recruiter_fees", name: "Recruiter fees", color: "#f59e0b", llm: "external headhunter costs" },
      { code: "referral_bonus", name: "Referral bonuses", color: "#10b981", llm: "internal employee referrals" },
      { code: "background_checks", name: "Background checks", color: "#6366f1", llm: "verification services" },
    ],
    job_type: [
      { code: "permanent", name: "Permanent", color: "#10b981" },
      { code: "contract", name: "Contract", color: "#3b82f6" },
      { code: "c2h", name: "Contract-to-Hire", color: "#f59e0b" },
      { code: "freelance", name: "Freelance", color: "#6366f1" },
    ],
    employment_type: [
      { code: "w2", name: "W2 Full-time", color: "#10b981" },
      { code: "c2c", name: "Corp-to-Corp (C2C)", color: "#3b82f6" },
      { code: "1099", name: "1099 Contractor", color: "#f59e0b" },
      { code: "intern", name: "Intern", color: "#6366f1" },
    ],
    work_auth: [
      { code: "citizen", name: "US Citizen", color: "#10b981" },
      { code: "green_card", name: "Green Card", color: "#10b981" },
      { code: "h1b", name: "H1-B Visa", color: "#3b82f6" },
      { code: "ead", name: "EAD", color: "#3b82f6" },
      { code: "canadian", name: "Canadian Citizen", color: "#10b981" },
      { code: "not_required", name: "Not required", color: "#94a3b8" },
    ],
    applicant_status: [
      { code: "unprocessed", name: "Unprocessed", color: "#94a3b8" },
      { code: "screening", name: "Phone Screening", color: "#3b82f6" },
      { code: "interview_internal", name: "Internal Interview", color: "#8b5cf6" },
      { code: "interview_client", name: "Client Interview", color: "#ec4899" },
      { code: "offered", name: "Offered", color: "#f59e0b" },
      { code: "hired", name: "Hired", color: "#10b981" },
      { code: "rejected", name: "Rejected", color: "#ef4444" },
    ],
    engage: [
      { code: "announcement", name: "Announcement", color: "#f59e0b" },
      { code: "case_study", name: "Case study", color: "#ec4899" },
      { code: "product_update", name: "Product update", color: "#3b82f6" },
      { code: "tutorial", name: "Tutorial", color: "#8b5cf6" },
      { code: "blog", name: "Blog post", color: "#0d9488" },
      { code: "job_post", name: "Job posting", color: "#6366f1" },
      { code: "event", name: "Event", color: "#f97316" },
      { code: "newsletter", name: "Newsletter", color: "#10b981" },
    ],
    reminder: [
      { code: "tax_filing", name: "Tax Filing", color: "#ef4444" },
      { code: "gst_filing", name: "GST/VAT Filing", color: "#f97316" },
      { code: "annual_audit", name: "Annual Audit", color: "#7e22ce" },
      { code: "payroll_processing", name: "Payroll Processing", color: "#ec4899" },
      { code: "invoice_payment", name: "Invoice Payment", color: "#1e3a8a" },
      { code: "budget_review", name: "Budget Review", color: "#10b981" },
      { code: "vendor_followup", name: "Vendor Follow-up", color: "#06b6d4" },
      { code: "project_deadline", name: "Project Deadline", color: "#f59e0b" },
      { code: "internal_sync", name: "Internal Sync", color: "#8b5cf6" },
      { code: "contract_renewal", name: "Contract Renewal", color: "#0d9488" },
      { code: "doc_filing", name: "Document Filing", color: "#94a3b8" },
    ],
  },
  chartAccounts: [
    { code: "1000", name: "Cash", type: "asset", isSystem: true },
    { code: "1100", name: "Bank Accounts", type: "asset", isSystem: true },
    { code: "1200", name: "Accounts Receivable", type: "asset", isSystem: true },
    { code: "1300", name: "Prepaid Expenses", type: "asset", isSystem: true },
    { code: "1500", name: "Fixed Assets", type: "asset", isSystem: true },
    { code: "2000", name: "Accounts Payable", type: "liability", isSystem: true },
    { code: "2100", name: "Credit Cards", type: "liability", isSystem: true },
    { code: "2200", name: "Loans Payable", type: "liability", isSystem: true },
    { code: "2300", name: "Tax Payable", type: "liability", isSystem: true },
    { code: "3000", name: "Owner's Equity", type: "equity", isSystem: true },
    { code: "3100", name: "Retained Earnings", type: "equity", isSystem: true },
    { code: "4000", name: "Sales Revenue", type: "revenue", isSystem: true },
    { code: "4100", name: "Service Revenue", type: "revenue", isSystem: true },
    { code: "4200", name: "Interest Income", type: "revenue", isSystem: true },
    { code: "4300", name: "Other Income", type: "revenue", isSystem: true },
    { code: "5000", name: "Cost of Goods Sold", type: "expense", isSystem: true },
    { code: "5100", name: "Salaries & Wages", type: "expense", isSystem: true },
    { code: "5200", name: "Rent", type: "expense", isSystem: true },
    { code: "5300", name: "Utilities", type: "expense", isSystem: true },
    { code: "5400", name: "Office Supplies", type: "expense", isSystem: true },
    { code: "5500", name: "Travel & Entertainment", type: "expense", isSystem: true },
    { code: "5600", name: "Professional Fees", type: "expense", isSystem: true },
    { code: "5700", name: "Insurance", type: "expense", isSystem: true },
    { code: "5800", name: "Depreciation", type: "expense", isSystem: true },
    { code: "5900", name: "Other Expenses", type: "expense", isSystem: true },
  ],
}

export const PERSONAL_DEFAULTS = BUSINESS_DEFAULTS

// --- Regional Tax Seeding ---

export const DEFAULT_TAXES_BY_CURRENCY: Record<string, { name: string; rate: number; type?: string }[]> = {
  INR: [
    { name: "GST 0%", rate: 0 },
    { name: "GST 5%", rate: 5 },
    { name: "GST 12%", rate: 12 },
    { name: "GST 18%", rate: 18 },
    { name: "GST 28%", rate: 28 },
    { name: "IGST 5%", rate: 5 },
    { name: "IGST 12%", rate: 12 },
    { name: "IGST 18%", rate: 18 },
    { name: "IGST 28%", rate: 28 },
  ],
  GBP: [
    { name: "VAT 0%", rate: 0 },
    { name: "VAT 5%", rate: 5 },
    { name: "VAT 20%", rate: 20 },
  ],
  EUR: [
    { name: "VAT 0%", rate: 0 },
    { name: "VAT 9%", rate: 9 },
    { name: "VAT 21%", rate: 21 },
  ],
  AUD: [
    { name: "GST 10% (inclusive)", rate: 10, type: "inclusive" },
    { name: "No GST", rate: 0 },
  ],
  CAD: [
    { name: "GST 5%", rate: 5 },
    { name: "HST 13%", rate: 13 },
    { name: "PST 7%", rate: 7 },
  ],
  SGD: [
    { name: "GST 9%", rate: 9 },
  ],
  USD: [], // Varies by state, keep empty for user customization
}

export const DEFAULT_PROJECTS = [{ code: "personal", name: "Personal", llm_prompt: "personal", color: "#1e202b" }]

export const DEFAULT_CURRENCIES = [
  { code: "INR", name: "₹" },
  { code: "USD", name: "$" },
  { code: "EUR", name: "€" },
  { code: "GBP", name: "£" },
  { code: "AUD", name: "$" },
  { code: "CAD", name: "$" },
  { code: "SGD", name: "$" },
  { code: "CHF", name: "Fr" },
  { code: "MYR", name: "RM" },
  { code: "JPY", name: "¥" },
  { code: "CNY", name: "¥" },
  { code: "AED", name: "د.إ" },
  { code: "BTC", name: "Crypto" },
  { code: "ETH", name: "Crypto" },
]

export const DEFAULT_FIELDS = [
  { code: "name", name: "Name", type: "string", llm_prompt: "human readable name, summarize what is bought or paid for in the invoice", isVisibleInList: true, isVisibleInAnalysis: true, isRequired: true, isExtra: false },
  { code: "description", name: "Description", type: "string", llm_prompt: "description of the transaction", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "number", name: "Number", type: "string", llm_prompt: "", isVisibleInList: true, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "merchant", name: "Merchant", type: "string", llm_prompt: "merchant name, use the original spelling and language", isVisibleInList: false, isVisibleInAnalysis: true, isRequired: false, isExtra: false },
  { code: "contactId", name: "Vendor", type: "string", llm_prompt: "", isVisibleInList: true, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "issuedAt", name: "Date", type: "string", llm_prompt: "issued at date (YYYY-MM-DD format)", isVisibleInList: true, isVisibleInAnalysis: true, isRequired: true, isExtra: false },
  { code: "projectCode", name: "Project", type: "string", llm_prompt: "project code, one of: {projects.code}", isVisibleInList: false, isVisibleInAnalysis: true, isRequired: false, isExtra: false },
  { code: "categoryCode", name: "Category", type: "string", llm_prompt: "category code, one of: {categories.code}", isVisibleInList: true, isVisibleInAnalysis: true, isRequired: false, isExtra: false },
  { code: "chartAccountId", name: "Chart account", type: "string", llm_prompt: "", isVisibleInList: true, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "bankAccountId", name: "Account", type: "string", llm_prompt: "", isVisibleInList: true, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "paymentMethod", name: "Payment method", type: "string", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "reference", name: "Reference", type: "string", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "status", name: "Status", type: "string", llm_prompt: "", isVisibleInList: true, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "source", name: "Source", type: "string", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "reconciled", name: "Reconciled", type: "boolean", llm_prompt: "", isVisibleInList: true, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "taxAmount", name: "Tax amount", type: "number", llm_prompt: "tax amount on the transaction", isVisibleInList: false, isVisibleInAnalysis: true, isRequired: false, isExtra: false },
  { code: "taxRate", name: "Tax rate", type: "string", llm_prompt: "tax rate identifier (e.g. GST_18, VAT_20)", isVisibleInList: false, isVisibleInAnalysis: true, isRequired: false, isExtra: false },
  { code: "createdAt", name: "Created", type: "string", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "updatedAt", name: "Last modified", type: "string", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "files", name: "Files", type: "string", llm_prompt: "", isVisibleInList: true, isVisibleInAnalysis: true, isRequired: false, isExtra: false },
  { code: "total", name: "Total", type: "number", llm_prompt: "total total of the transaction", isVisibleInList: true, isVisibleInAnalysis: true, isRequired: true, isExtra: false },
  { code: "currencyCode", name: "Currency", type: "string", llm_prompt: "currency code, ISO 4217 three letter code like USD, EUR, including crypto codes like BTC, ETH, etc", isVisibleInList: false, isVisibleInAnalysis: true, isRequired: false, isExtra: false },
  { code: "convertedTotal", name: "Converted Total", type: "number", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "convertedCurrencyCode", name: "Converted Currency Code", type: "string", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "type", name: "Type", type: "string", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: true, isRequired: false, isExtra: false },
  { code: "note", name: "Note", type: "string", llm_prompt: "", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
  { code: "vat_rate", name: "VAT/GST Rate", type: "number", llm_prompt: "VAT/GST rate in percentage 0-100", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: true },
  { code: "vat", name: "VAT/GST Amount", type: "number", llm_prompt: "total VAT/GST in currency of the invoice", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: true },
  { code: "text", name: "Extracted Text", type: "string", llm_prompt: "extract all recognised text from the invoice", isVisibleInList: false, isVisibleInAnalysis: false, isRequired: false, isExtra: false },
]

export async function seedDefaultTaxes(orgId: string, currency: string) {
  const taxes = DEFAULT_TAXES_BY_CURRENCY[currency] || []
  for (const tax of taxes) {
    await prisma.tax.upsert({
      where: { organizationId_name: { organizationId: orgId, name: tax.name } },
      update: { rate: tax.rate, type: tax.type || "normal" },
      create: { ...tax, organizationId: orgId },
    })
  }
}

export async function createOrgDefaults(orgId: string, orgType = "business", options?: { baseCurrency?: string }) {
  const defaults = orgType === "personal" ? PERSONAL_DEFAULTS : BUSINESS_DEFAULTS
  const baseCurrency = options?.baseCurrency || "INR"

  // Default projects
  for (const project of DEFAULT_PROJECTS) {
    await prisma.project.upsert({
      where: { organizationId_code: { code: project.code, organizationId: orgId } },
      update: { name: project.name, color: project.color, llm_prompt: project.llm_prompt },
      create: { ...project, organizationId: orgId },
    })
  }

  // Seed parent (module-level) categories first
  const parentIdMap: Record<string, string> = {}
  for (const [type, parent] of Object.entries(PARENT_CATEGORIES)) {
    const record = await prisma.category.upsert({
      where: { organizationId_code: { code: parent.code, organizationId: orgId } },
      update: { name: parent.name, color: parent.color, type },
      create: { organizationId: orgId, code: parent.code, name: parent.name, color: parent.color, type },
    })
    parentIdMap[type] = record.id
  }

  // Seed child categories linked to their parent
  for (const [type, list] of Object.entries(defaults.categories)) {
    for (const category of list) {
      await prisma.category.upsert({
        where: { organizationId_code: { code: category.code, organizationId: orgId } },
        update: { name: category.name, color: category.color, llm_prompt: (category as any).llm, type, parentId: parentIdMap[type] || null },
        create: {
          organizationId: orgId,
          code: category.code,
          name: category.name,
          color: category.color,
          llm_prompt: (category as any).llm,
          type,
          parentId: parentIdMap[type] || null,
        },
      })
    }
  }

  // Default currencies
  for (const currency of DEFAULT_CURRENCIES) {
    await prisma.currency.upsert({
      where: { organizationId_code: { code: currency.code, organizationId: orgId } },
      update: { name: currency.name },
      create: { ...currency, organizationId: orgId },
    })
  }

  // Default fields
  for (const field of DEFAULT_FIELDS) {
    await prisma.field.upsert({
      where: { organizationId_code: { code: field.code, organizationId: orgId } },
      update: {
        name: field.name,
        type: field.type,
        llm_prompt: field.llm_prompt,
        isVisibleInList: field.isVisibleInList,
        isVisibleInAnalysis: field.isVisibleInAnalysis,
        isRequired: field.isRequired,
        isExtra: field.isExtra,
      },
      create: { ...field, organizationId: orgId },
    })
  }

  // Default settings
  for (const setting of DEFAULT_SETTINGS) {
    let value = setting.value
    if (setting.code === "default_currency" && options?.baseCurrency) {
      value = options.baseCurrency
    }

    await prisma.setting.upsert({
      where: { organizationId_code: { code: setting.code, organizationId: orgId } },
      update: { name: setting.name, description: setting.description, value },
      create: { ...setting, organizationId: orgId, value },
    })
  }

  // Default chart of accounts
  for (const account of defaults.chartAccounts) {
    await prisma.chartAccount.upsert({
      where: { organizationId_code: { code: account.code, organizationId: orgId } },
      update: { name: account.name, type: account.type },
      create: { ...account, organizationId: orgId },
    })
  }

  // Regional Taxes based on org currency
  await seedDefaultTaxes(orgId, baseCurrency)
}

export async function seedReminderDefaults(orgId: string) {
  const type = "reminder"
  const parent = PARENT_CATEGORIES[type]
  const list = BUSINESS_DEFAULTS.categories[type]

  // Seed parent category
  const parentRecord = await prisma.category.upsert({
    where: { organizationId_code: { code: parent.code, organizationId: orgId } },
    update: { name: parent.name, color: parent.color, type },
    create: { organizationId: orgId, code: parent.code, name: parent.name, color: parent.color, type },
  })

  // Seed child categories
  for (const category of list) {
    await prisma.category.upsert({
      where: { organizationId_code: { code: category.code, organizationId: orgId } },
      update: { name: category.name, color: category.color, type, parentId: parentRecord.id },
      create: {
        organizationId: orgId,
        code: category.code,
        name: category.name,
        color: category.color,
        type,
        parentId: parentRecord.id,
      },
    })
  }
}

export async function isOrgEmpty(orgId: string) {
  const fieldsCount = await prisma.field.count({ where: { organizationId: orgId } })
  return fieldsCount === 0
}

import { formatCurrency } from "@/lib/utils"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { ReactElement } from "react"
import { AdditionalFee, AdditionalTax, InvoiceFormData, InvoiceItem } from "./types"

// ── Environment-aware paths ─────────────────────────────────────────────────
const isServer = typeof window === "undefined"
const fontBase = isServer ? "public/fonts/Inter/" : "/fonts/Inter/"
const MINTAX_LOGO = isServer ? "public/mintax-logo.png" : "/mintax-logo.png"

// ── Mintax brand tokens (match email-layout.tsx BRAND) ──────────────────────
const BRAND = {
  primary:    "#c96442",
  background: "#f9f6f1",
  foreground: "#362f28",
  muted:      "#6b6460",
  card:       "#f2ede7",
  border:     "#d9d4ce",
}

// ── Font registration ────────────────────────────────────────────────────────
Font.register({
  family: "Inter",
  fonts: [
    { src: `${fontBase}Inter-Regular.otf`,    fontWeight: 400, fontStyle: "normal" },
    { src: `${fontBase}Inter-Medium.otf`,     fontWeight: 500, fontStyle: "normal" },
    { src: `${fontBase}Inter-SemiBold.otf`,   fontWeight: 600, fontStyle: "normal" },
    { src: `${fontBase}Inter-Bold.otf`,       fontWeight: 700, fontStyle: "normal" },
    { src: `${fontBase}Inter-ExtraBold.otf`,  fontWeight: 800, fontStyle: "normal" },
    { src: `${fontBase}Inter-Italic.otf`,     fontWeight: 400, fontStyle: "italic" },
    { src: `${fontBase}Inter-MediumItalic.otf`,   fontWeight: 500, fontStyle: "italic" },
    { src: `${fontBase}Inter-SemiBoldItalic.otf`, fontWeight: 600, fontStyle: "italic" },
    { src: `${fontBase}Inter-BoldItalic.otf`,     fontWeight: 700, fontStyle: "italic" },
  ],
})

Font.registerEmojiSource({
  format: "png",
  url: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/",
})

// ── Shared base styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:       { fontFamily: "Inter", backgroundColor: "#ffffff" },
  // Header
  headerBlock: { paddingHorizontal: 40, paddingTop: 36, paddingBottom: 28 },
  headerRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orgLogo:     { width: 120, height: 40, objectFit: "contain" },
  invoiceLabel: { fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#9CA3AF", marginBottom: 6 },
  invoiceNumber: { fontSize: 22, fontWeight: 800 },
  // Info grid
  infoGrid:    { flexDirection: "row", paddingHorizontal: 40, paddingBottom: 28, gap: 0 },
  infoCell:    { flex: 1 },
  infoLabel:   { fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#9CA3AF", marginBottom: 6 },
  infoValue:   { fontSize: 10.5, lineHeight: 1.6, color: "#374151" },
  infoValueBold: { fontSize: 10.5, fontWeight: 700, color: "#111827", marginBottom: 2 },
  divider:     { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 40, marginBottom: 28 },
  // Table
  tableWrap:   { marginHorizontal: 40, marginBottom: 28 },
  tableHead:   { flexDirection: "row", borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10 },
  tableRow:    { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  tableRowAlt: { backgroundColor: "#FAFAFA" },
  colDesc:     { flex: 3, paddingRight: 8 },
  colQty:      { flex: 1, textAlign: "right" },
  colPrice:    { flex: 1, textAlign: "right" },
  colTotal:    { flex: 1, textAlign: "right" },
  thText:      { fontSize: 8, fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: 1 },
  tdName:      { fontSize: 10.5, fontWeight: 600, color: "#111827" },
  tdDesc:      { fontSize: 9, color: "#9CA3AF", marginTop: 2 },
  tdVal:       { fontSize: 10.5, color: "#374151" },
  // Totals
  totalsRow:   { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 40, marginBottom: 6 },
  totalsBlock: { width: "40%" },
  totalsLine:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  totalsLabel: { fontSize: 10, color: "#6B7280" },
  totalsValue: { fontSize: 10, color: "#374151" },
  totalsDivider: { height: 1.5, marginBottom: 6, borderRadius: 1 },
  grandLabel:  { fontSize: 13, fontWeight: 800 },
  grandValue:  { fontSize: 13, fontWeight: 800 },
  // Notes
  notesWrap:   { marginHorizontal: 40, marginBottom: 28, padding: 14, borderRadius: 8, backgroundColor: "#F9FAFB", borderLeftWidth: 3 },
  notesTitle:  { fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#9CA3AF", marginBottom: 6 },
  notesText:   { fontSize: 10, lineHeight: 1.6, color: "#4B5563" },
  // Mintax branding footer
  brandingBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 40, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6", marginBottom: 12 },
  brandingLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
  mintaxLogo:    { width: 56, height: 18, objectFit: "contain" },
  poweredText:   { fontSize: 8, color: "#9CA3AF" },
  poweredBrand:  { fontSize: 8, fontWeight: 700, color: "#c96442" },
  footerLeft:    { fontSize: 8, color: "#9CA3AF" },
  footerRight:   { fontSize: 7.5, color: "#D1D5DB", letterSpacing: 0.5 },
  // Bank / footer note
  bankBlock:   { marginHorizontal: 40, padding: 12, borderRadius: 8, backgroundColor: "#F9FAFB", marginBottom: 20 },
  bankText:    { fontSize: 9, color: "#6B7280", lineHeight: 1.6 },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number, currency: string) {
  return formatCurrency(val, currency)
}

function calcTotals(data: InvoiceFormData) {
  const subtotal = data.items.reduce((s: number, i: InvoiceItem) => s + i.subtotal, 0)
  const taxes    = data.additionalTaxes.reduce((s: number, t: AdditionalTax) => s + t.amount, 0)
  const fees     = data.additionalFees.reduce((s: number, f: AdditionalFee) => s + f.amount, 0)
  const total    = data.taxIncluded ? subtotal : subtotal + taxes + fees
  return { subtotal, taxes, fees, total }
}

function fmtDate(val: string | null | undefined) {
  if (!val) return "—"
  try { return new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }
  catch { return val }
}

// ── Mintax branding footer (shared across all templates) ─────────────────────

function MintaxBranding({ data, accent, userFooter }: { data: InvoiceFormData; accent: string; userFooter?: string }) {
  return (
    <>
      {/* Bank details / custom footer note */}
      {(userFooter || data.bankDetails) && (
        <View style={s.bankBlock}>
          <Text style={s.bankText}>{userFooter || data.bankDetails}</Text>
        </View>
      )}

      {/* Powered by branding bar */}
      <View style={s.brandingBar}>
        <View style={s.brandingLeft}>
          <Image src={MINTAX_LOGO} style={s.mintaxLogo} />
          <Text style={s.poweredText}>Powered by <Text style={s.poweredBrand}>Mintax</Text></Text>
        </View>
        <Text style={s.footerRight}>
          Mindtris™ Inc. · mintax.app
        </Text>
      </View>
    </>
  )
}

// ── Items table (shared) ──────────────────────────────────────────────────────

function ItemsTable({ data, accent }: { data: InvoiceFormData; accent: string }) {
  return (
    <View style={s.tableWrap}>
      {/* Header row */}
      <View style={[s.tableHead, { backgroundColor: accent }]}>
        <Text style={[s.thText, s.colDesc]}>{data.itemLabel}</Text>
        <Text style={[s.thText, s.colQty]}>{data.quantityLabel}</Text>
        <Text style={[s.thText, s.colPrice]}>{data.unitPriceLabel}</Text>
        <Text style={[s.thText, s.colTotal]}>{data.subtotalLabel}</Text>
      </View>

      {data.items.map((item: InvoiceItem, i: number) => (
        <View key={i} style={[s.tableRow, i % 2 !== 0 ? s.tableRowAlt : {}]}>
          <View style={s.colDesc}>
            <Text style={s.tdName}>{item.name}</Text>
            {item.showSubtitle && item.subtitle ? <Text style={s.tdDesc}>{item.subtitle}</Text> : null}
          </View>
          <Text style={[s.tdVal, s.colQty]}>{item.quantity}</Text>
          <Text style={[s.tdVal, s.colPrice]}>{fmt(item.unitPrice * 100, data.currency)}</Text>
          <Text style={[s.tdVal, s.colTotal]}>{fmt(item.subtotal * 100, data.currency)}</Text>
        </View>
      ))}
    </View>
  )
}

// ── Totals block (shared) ─────────────────────────────────────────────────────

function TotalsBlock({ data, accent }: { data: InvoiceFormData; accent: string }) {
  const { subtotal, taxes, total } = calcTotals(data)
  return (
    <View style={s.totalsRow}>
      <View style={s.totalsBlock}>
        <View style={s.totalsLine}>
          <Text style={s.totalsLabel}>{data.summarySubtotalLabel}</Text>
          <Text style={s.totalsValue}>{fmt(subtotal * 100, data.currency)}</Text>
        </View>
        {data.additionalTaxes.map((tax: AdditionalTax, i: number) => (
          <View key={i} style={s.totalsLine}>
            <Text style={s.totalsLabel}>{tax.name}{tax.rate > 0 ? ` (${tax.rate}%)` : ""}:</Text>
            <Text style={s.totalsValue}>{fmt(tax.amount * 100, data.currency)}</Text>
          </View>
        ))}
        {data.additionalFees.map((fee: AdditionalFee, i: number) => (
          <View key={i} style={s.totalsLine}>
            <Text style={s.totalsLabel}>{fee.name}:</Text>
            <Text style={s.totalsValue}>{fmt(fee.amount * 100, data.currency)}</Text>
          </View>
        ))}
        <View style={[s.totalsDivider, { backgroundColor: accent }]} />
        <View style={s.totalsLine}>
          <Text style={[s.grandLabel, { color: accent }]}>{data.summaryTotalLabel}</Text>
          <Text style={[s.grandValue, { color: accent }]}>{fmt(total * 100, data.currency)}</Text>
        </View>
      </View>
    </View>
  )
}

// ════════════════════════════════════════════════════════════
// DEFAULT template  — warm card header, logo top-left
// ════════════════════════════════════════════════════════════

function DefaultLayout({ data, accent }: { data: InvoiceFormData; accent: string }) {
  const logo = data.businessLogo || MINTAX_LOGO
  return (
    <Page size="A4" style={s.page}>
      {/* Header card */}
      <View style={{ backgroundColor: BRAND.background, paddingHorizontal: 40, paddingTop: 36, paddingBottom: 28 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          {/* Org logo */}
          <View style={{ width: 140, height: 44 }}>
            <Image src={logo} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </View>
          {/* Invoice label */}
          <View style={{ textAlign: "right" }}>
            <Text style={[s.invoiceLabel, { color: BRAND.muted }]}>{data.title}</Text>
            <Text style={[s.invoiceNumber, { color: BRAND.foreground, fontSize: 20 }]}>{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Dates + bill-to in a row */}
        <View style={{ flexDirection: "row", gap: 0 }}>
          <View style={{ flex: 2, marginRight: 24 }}>
            <Text style={[s.infoLabel, { color: BRAND.muted }]}>{data.billToLabel}</Text>
            <Text style={[s.infoValueBold, { color: BRAND.foreground }]}>{data.billTo?.split("\n")[0]}</Text>
            <Text style={[s.infoValue, { color: BRAND.muted }]}>{data.billTo?.split("\n").slice(1).join("\n")}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[s.infoLabel, { color: BRAND.muted }]}>{data.issueDateLabel}</Text>
            <Text style={[s.infoValue, { color: BRAND.foreground }]}>{fmtDate(data.date)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.infoLabel, { color: BRAND.muted }]}>{data.dueDateLabel}</Text>
            <Text style={[s.infoValue, { color: BRAND.foreground, fontWeight: 600 }]}>{fmtDate(data.dueDate)}</Text>
          </View>
        </View>
      </View>

      {/* From section */}
      <View style={{ paddingHorizontal: 40, paddingVertical: 20 }}>
        <Text style={s.infoLabel}>{data.companyDetailsLabel}</Text>
        <Text style={s.infoValue}>{data.companyDetails}</Text>
      </View>

      <View style={s.divider} />

      <ItemsTable data={data} accent={accent} />
      <TotalsBlock data={data} accent={accent} />

      {data.notes && (
        <View style={[s.notesWrap, { borderLeftColor: accent }]}>
          <Text style={s.notesTitle}>Notes</Text>
          <Text style={s.notesText}>{data.notes}</Text>
        </View>
      )}

      <MintaxBranding data={data} accent={accent} userFooter={data.footerText} />
    </Page>
  )
}

// ════════════════════════════════════════════════════════════
// CLASSIC template — centered letterhead, accent underline
// ════════════════════════════════════════════════════════════

function ClassicLayout({ data, accent }: { data: InvoiceFormData; accent: string }) {
  const logo = data.businessLogo || MINTAX_LOGO
  return (
    <Page size="A4" style={s.page}>
      {/* Letterhead */}
      <View style={{ paddingHorizontal: 40, paddingTop: 36, paddingBottom: 0, alignItems: "center", borderBottomWidth: 2, borderBottomColor: accent, marginBottom: 24, flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View style={{ width: 100, height: 36 }}>
            <Image src={logo} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </View>
          <View>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{data.companyDetails.split("\n")[0]}</Text>
            <Text style={{ fontSize: 9, color: "#9CA3AF" }}>{data.companyDetails.split("\n").slice(1).join(" · ")}</Text>
          </View>
        </View>
        <View style={{ textAlign: "right", marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: 1 }}>{data.title}</Text>
          <Text style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{data.invoiceNumber}</Text>
        </View>
      </View>

      {/* Bill to + dates */}
      <View style={{ flexDirection: "row", paddingHorizontal: 40, marginBottom: 24 }}>
        <View style={{ flex: 1.5, borderLeftWidth: 3, borderLeftColor: accent, paddingLeft: 12, marginRight: 24 }}>
          <Text style={s.infoLabel}>{data.billToLabel}</Text>
          <Text style={s.infoValueBold}>{data.billTo?.split("\n")[0]}</Text>
          <Text style={s.infoValue}>{data.billTo?.split("\n").slice(1).join("\n")}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 12 }}>
            <Text style={s.infoLabel}>{data.issueDateLabel}</Text>
            <Text style={s.infoValue}>{fmtDate(data.date)}</Text>
          </View>
          <View>
            <Text style={s.infoLabel}>{data.dueDateLabel}</Text>
            <Text style={[s.infoValue, { fontWeight: 600 }]}>{fmtDate(data.dueDate)}</Text>
          </View>
        </View>
      </View>

      <View style={s.divider} />
      <ItemsTable data={data} accent={accent} />
      <TotalsBlock data={data} accent={accent} />

      {data.notes && (
        <View style={[s.notesWrap, { borderLeftColor: accent }]}>
          <Text style={s.notesTitle}>Notes</Text>
          <Text style={s.notesText}>{data.notes}</Text>
        </View>
      )}

      <MintaxBranding data={data} accent={accent} userFooter={data.footerText} />
    </Page>
  )
}

// ════════════════════════════════════════════════════════════
// MODERN template — bold full-width accent header
// ════════════════════════════════════════════════════════════

function ModernLayout({ data, accent }: { data: InvoiceFormData; accent: string }) {
  const logo = data.businessLogo || MINTAX_LOGO
  return (
    <Page size="A4" style={s.page}>
      {/* Full-bleed accent header */}
      <View style={{ backgroundColor: accent, paddingHorizontal: 40, paddingVertical: 32 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* Title + number */}
          <View>
            <Text style={{ fontSize: 30, fontWeight: 800, color: "#ffffff", letterSpacing: -0.5, marginBottom: 4 }}>
              {data.title}
            </Text>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              {data.invoiceNumber}
            </Text>
          </View>
          {/* Logo with white rounded bg pill */}
          <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 8, width: 130, height: 44, justifyContent: "center" }}>
            <Image src={logo} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </View>
        </View>

        {/* Metadata strip */}
        <View style={{ flexDirection: "row", marginTop: 20, gap: 0 }}>
          <View style={{ marginRight: 28 }}>
            <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>{data.issueDateLabel}</Text>
            <Text style={{ fontSize: 11, color: "#ffffff", fontWeight: 600 }}>{fmtDate(data.date)}</Text>
          </View>
          <View style={{ marginRight: 28 }}>
            <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>{data.dueDateLabel}</Text>
            <Text style={{ fontSize: 11, color: "#ffffff", fontWeight: 700 }}>{fmtDate(data.dueDate)}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>{data.billToLabel}</Text>
            <Text style={{ fontSize: 11, color: "#ffffff", fontWeight: 600 }}>{data.billTo?.split("\n")[0]}</Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{data.billTo?.split("\n").slice(1).join(" · ")}</Text>
          </View>
        </View>
      </View>

      {/* From strip */}
      <View style={{ backgroundColor: "#F9FAFB", paddingHorizontal: 40, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", marginBottom: 24 }}>
        <Text style={[s.infoLabel, { marginBottom: 2 }]}>{data.companyDetailsLabel}</Text>
        <Text style={[s.infoValue, { color: "#6B7280" }]}>{data.companyDetails.replace(/\n/g, " · ")}</Text>
      </View>

      <ItemsTable data={data} accent={accent} />
      <TotalsBlock data={data} accent={accent} />

      {data.notes && (
        <View style={[s.notesWrap, { borderLeftColor: accent }]}>
          <Text style={s.notesTitle}>Notes</Text>
          <Text style={s.notesText}>{data.notes}</Text>
        </View>
      )}

      <MintaxBranding data={data} accent={accent} userFooter={data.footerText} />
    </Page>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export function InvoicePDF({ data }: { data: InvoiceFormData }): ReactElement {
  const accent   = data.accentColor || BRAND.primary
  const template = data.template   || "default"

  return (
    <Document
      title={`${data.title} ${data.invoiceNumber}`}
      author="Mintax"
      creator="Mintax · mintax.app"
      producer="Mindtris Inc."
    >
      {template === "modern"  ? <ModernLayout  data={data} accent={accent} /> :
       template === "classic" ? <ClassicLayout data={data} accent={accent} /> :
                                <DefaultLayout data={data} accent={accent} />}
    </Document>
  )
}

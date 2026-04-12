"use client"

import { cn } from "@/lib/utils"

interface InvoiceTemplatePreviewProps {
  template: "default" | "classic" | "modern"
  accentColor: string
  orgName: string
  selected?: boolean
  onClick?: () => void
}

export function InvoiceTemplatePreview({
  template,
  accentColor,
  orgName,
  selected,
  onClick,
}: InvoiceTemplatePreviewProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-lg border-2 p-1 transition-all hover:shadow-md cursor-pointer text-left w-full",
        selected ? "border-primary shadow-md" : "border-border hover:border-primary/40"
      )}
    >
      {selected && (
        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
          Active
        </span>
      )}
      <div className="rounded-md overflow-hidden bg-white aspect-[8.5/11] flex flex-col text-[6px] leading-tight">
        {template === "default" && <DefaultTemplate accentColor={accentColor} orgName={orgName} />}
        {template === "classic" && <ClassicTemplate accentColor={accentColor} orgName={orgName} />}
        {template === "modern" && <ModernTemplate accentColor={accentColor} orgName={orgName} />}
      </div>
      <p className="text-xs font-medium text-center mt-2 mb-1 capitalize">{template}</p>
    </button>
  )
}

// ── Shared branding footer ──────────────────────────────────────────────────

function BrandingFooter({ accentColor }: { accentColor: string }) {
  return (
    <div className="px-3 pb-1.5 mt-auto">
      <div className="border-t border-gray-100 pt-1 flex justify-between items-center">
        <div className="text-[5px] text-gray-400">Thank you for your business.</div>
        <div className="flex items-center gap-0.5">
          <svg width="6" height="6" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill={accentColor} />
            <path d="M10 28V12l10 8 10-8v16" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[4px] text-gray-300">Powered by <span style={{ color: accentColor }} className="font-semibold">Mindtris</span> <span className="text-gray-300">(Mintax)</span></span>
        </div>
      </div>
    </div>
  )
}

// ── Default Template ────────────────────────────────────────────────────────

function DefaultTemplate({ accentColor, orgName }: { accentColor: string; orgName: string }) {
  return (
    <>
      <div className="p-3 flex justify-between items-start">
        <div className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill={accentColor} />
            <path d="M10 28V12l10 8 10-8v16" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div className="font-bold text-[8px]" style={{ color: accentColor }}>{orgName}</div>
            <div className="text-[4px] text-gray-400">Powered by Mindtris (Mintax)</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[9px] text-gray-800">INVOICE</div>
          <div className="text-[5px] text-gray-400">#INV-001</div>
        </div>
      </div>
      <div className="px-3 flex justify-between">
        <div>
          <div className="text-[5px] text-gray-400">Bill to</div>
          <div className="font-semibold text-[6px]">Client Name</div>
          <div className="text-[5px] text-gray-400">client@email.com</div>
        </div>
        <div className="text-right">
          <div className="text-[5px] text-gray-400">Date: Jan 15, 2026</div>
          <div className="text-[5px] text-gray-400">Due: Feb 14, 2026</div>
        </div>
      </div>
      <div className="px-3 mt-2 flex-1">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: accentColor }}>
              <th className="text-left text-white px-1 py-0.5">Item</th>
              <th className="text-right text-white px-1 py-0.5">Qty</th>
              <th className="text-right text-white px-1 py-0.5">Price</th>
              <th className="text-right text-white px-1 py-0.5">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-1 py-0.5">Web development</td>
              <td className="text-right px-1">10</td>
              <td className="text-right px-1">$150</td>
              <td className="text-right px-1">$1,500</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-1 py-0.5">UI/UX design</td>
              <td className="text-right px-1">5</td>
              <td className="text-right px-1">$120</td>
              <td className="text-right px-1">$600</td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-end mt-1.5">
          <div className="text-right">
            <div className="flex justify-between gap-3"><span className="text-gray-400">Subtotal</span><span>$2,100</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-400">Tax (10%)</span><span>$210</span></div>
            <div className="flex justify-between gap-3 font-bold border-t border-gray-200 pt-0.5 mt-0.5" style={{ color: accentColor }}>
              <span>Total</span><span>$2,310</span>
            </div>
          </div>
        </div>
      </div>
      <BrandingFooter accentColor={accentColor} />
    </>
  )
}

// ── Classic Template ────────────────────────────────────────────────────────

function ClassicTemplate({ accentColor, orgName }: { accentColor: string; orgName: string }) {
  return (
    <>
      <div className="p-3 border-b-2" style={{ borderColor: accentColor }}>
        <div className="text-center">
          <div className="font-bold text-[10px]" style={{ color: accentColor }}>{orgName}</div>
          <div className="text-[5px] text-gray-400">123 Business St, City | +1 234 567 890</div>
          <div className="text-[4px] text-gray-300 mt-0.5">Powered by Mindtris (Mintax)</div>
        </div>
      </div>
      <div className="px-3 pt-2 text-center">
        <div className="font-bold text-[8px] tracking-widest text-gray-600 uppercase">Invoice</div>
        <div className="text-[5px] text-gray-400 mt-0.5">#INV-001 | January 15, 2026</div>
      </div>
      <div className="px-3 mt-2 flex justify-between">
        <div className="border-l-2 pl-1.5" style={{ borderColor: accentColor }}>
          <div className="text-[5px] font-semibold text-gray-500 uppercase">Bill to</div>
          <div className="font-semibold text-[6px]">Client Name</div>
          <div className="text-[5px] text-gray-400">client@email.com</div>
        </div>
        <div className="text-right">
          <div className="text-[5px] font-semibold text-gray-500 uppercase">Due date</div>
          <div className="text-[6px]">February 14, 2026</div>
        </div>
      </div>
      <div className="px-3 mt-2 flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b-2" style={{ borderColor: accentColor }}>
              <th className="text-left px-1 py-0.5 text-gray-500">Description</th>
              <th className="text-right px-1 py-0.5 text-gray-500">Hours</th>
              <th className="text-right px-1 py-0.5 text-gray-500">Rate</th>
              <th className="text-right px-1 py-0.5 text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-1 py-0.5">Web development</td>
              <td className="text-right px-1">10</td>
              <td className="text-right px-1">$150</td>
              <td className="text-right px-1">$1,500</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-1 py-0.5">UI/UX design</td>
              <td className="text-right px-1">5</td>
              <td className="text-right px-1">$120</td>
              <td className="text-right px-1">$600</td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-end mt-1.5">
          <div className="w-1/2 text-right">
            <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>$2,100</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Tax</span><span>$210</span></div>
            <div className="flex justify-between font-bold text-[7px] border-t-2 pt-0.5 mt-0.5" style={{ borderColor: accentColor, color: accentColor }}>
              <span>Total Due</span><span>$2,310</span>
            </div>
          </div>
        </div>
      </div>
      <BrandingFooter accentColor={accentColor} />
    </>
  )
}

// ── Modern Template ─────────────────────────────────────────────────────────

function ModernTemplate({ accentColor, orgName }: { accentColor: string; orgName: string }) {
  return (
    <>
      <div className="p-3 text-white" style={{ backgroundColor: accentColor }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="rgba(255,255,255,0.2)" />
              <path d="M10 28V12l10 8 10-8v16" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="font-bold text-[9px]">{orgName}</div>
          </div>
          <div className="text-[8px] font-light tracking-wider opacity-80">INVOICE</div>
        </div>
        <div className="text-[5px] opacity-70 mt-0.5">123 Business St, City | info@company.com</div>
        <div className="text-[4px] opacity-50 mt-0.5">Powered by Mindtris (Mintax)</div>
      </div>
      <div className="px-3 pt-2 flex justify-between">
        <div>
          <div className="text-[5px] font-semibold uppercase" style={{ color: accentColor }}>Billed to</div>
          <div className="font-semibold text-[6px]">Client Name</div>
          <div className="text-[5px] text-gray-400">client@email.com</div>
        </div>
        <div className="text-right">
          <div className="text-[5px] text-gray-400">Invoice #INV-001</div>
          <div className="text-[5px] text-gray-400">Date: Jan 15, 2026</div>
          <div className="text-[5px] text-gray-400">Due: Feb 14, 2026</div>
        </div>
      </div>
      <div className="px-3 mt-2 flex-1">
        <div className="rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: `${accentColor}15` }}>
                <th className="text-left px-1 py-0.5" style={{ color: accentColor }}>Service</th>
                <th className="text-right px-1 py-0.5" style={{ color: accentColor }}>Qty</th>
                <th className="text-right px-1 py-0.5" style={{ color: accentColor }}>Rate</th>
                <th className="text-right px-1 py-0.5" style={{ color: accentColor }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="px-1 py-0.5">Web development</td>
                <td className="text-right px-1">10</td>
                <td className="text-right px-1">$150</td>
                <td className="text-right px-1">$1,500</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-1 py-0.5">UI/UX design</td>
                <td className="text-right px-1">5</td>
                <td className="text-right px-1">$120</td>
                <td className="text-right px-1">$600</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-1.5">
          <div className="rounded-md p-1.5 w-1/2" style={{ backgroundColor: `${accentColor}10` }}>
            <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>$2,100</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Tax</span><span>$210</span></div>
            <div className="flex justify-between font-bold text-[7px] border-t pt-0.5 mt-0.5" style={{ borderColor: accentColor, color: accentColor }}>
              <span>Total</span><span>$2,310</span>
            </div>
          </div>
        </div>
      </div>
      <BrandingFooter accentColor={accentColor} />
    </>
  )
}

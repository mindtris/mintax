"use server"

import { prisma } from "@/lib/core/db"
import type { Category, CategorizationRule, Contact, Transaction } from "@/lib/prisma/client"

// ─────────────────────────────────────────────────────────────────────────────
// Vendor memory — pre-fill fields based on the user's last transactions
// for the same Contact.
// ─────────────────────────────────────────────────────────────────────────────

export type VendorDefaults = {
  categoryCode?: string | null
  chartAccountId?: string | null
  projectCode?: string | null
  taxRate?: string | null
  paymentMethod?: string | null
  bankAccountId?: string | null
}

/**
 * Look at the last N transactions for this contact and return the most-used
 * value for each prefillable field. Used by the create form to remove
 * data-entry burden when a vendor is picked.
 */
export async function getVendorDefaults(
  orgId: string,
  contactId: string,
  lookback: number = 5,
): Promise<VendorDefaults> {
  const recent = await prisma.transaction.findMany({
    where: { organizationId: orgId, contactId },
    orderBy: { issuedAt: "desc" },
    take: lookback,
    select: {
      categoryCode: true,
      chartAccountId: true,
      projectCode: true,
      taxRate: true,
      paymentMethod: true,
      bankAccountId: true,
    },
  })

  if (recent.length === 0) return {}

  const mostFrequent = <K extends keyof (typeof recent)[number]>(key: K) => {
    const counts = new Map<string, number>()
    for (const r of recent) {
      const v = r[key] as string | null
      if (!v) continue
      counts.set(v, (counts.get(v) || 0) + 1)
    }
    let best: string | null = null
    let bestCount = 0
    for (const [v, c] of counts.entries()) {
      if (c > bestCount) {
        best = v
        bestCount = c
      }
    }
    return best
  }

  return {
    categoryCode: mostFrequent("categoryCode"),
    chartAccountId: mostFrequent("chartAccountId"),
    projectCode: mostFrequent("projectCode"),
    taxRate: mostFrequent("taxRate"),
    paymentMethod: mostFrequent("paymentMethod"),
    bankAccountId: mostFrequent("bankAccountId"),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fuzzy contact matching — given a merchant string from a receipt, find
// the best Contact match in the org.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Token-based fuzzy match. Returns the contact with the highest token overlap
 * (Jaccard similarity) above 0.5, or null if nothing matches well enough.
 */
export async function findContactByMerchant(
  orgId: string,
  merchant: string,
  type: string = "vendor",
): Promise<{ contact: Contact; confidence: number } | null> {
  if (!merchant || merchant.trim().length < 2) return null

  const contacts = await prisma.contact.findMany({
    where: { organizationId: orgId, type },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      taxId: true,
      address: true,
      city: true,
      country: true,
      type: true,
      website: true,
      currency: true,
      reference: true,
      organizationId: true,
      state: true,
      zipCode: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1),
    )

  const merchantTokens = tokenize(merchant)
  if (merchantTokens.size === 0) return null

  let best: { contact: Contact; confidence: number } | null = null
  for (const c of contacts) {
    const contactTokens = tokenize(c.name)
    if (contactTokens.size === 0) continue

    let intersection = 0
    for (const t of merchantTokens) if (contactTokens.has(t)) intersection++
    const union = merchantTokens.size + contactTokens.size - intersection
    const jaccard = union > 0 ? intersection / union : 0

    if (jaccard >= 0.5 && (!best || jaccard > best.confidence)) {
      best = { contact: c as Contact, confidence: jaccard }
    }
  }

  return best
}

// ─────────────────────────────────────────────────────────────────────────────
// Categorization rules — applied automatically on transaction create.
// ─────────────────────────────────────────────────────────────────────────────

export type RuleApplication = {
  categoryCode?: string
  chartAccountId?: string
  projectCode?: string
  taxRate?: string
  appliedRuleId?: string
  appliedRuleName?: string
}

/**
 * Walk active rules in priority order (lowest first) and return the
 * fields that the first matching rule would set. Returns {} if nothing matches.
 */
export async function applyCategorizationRules(
  orgId: string,
  draft: {
    merchant?: string | null
    total?: number | null
    paymentMethod?: string | null
    contactId?: string | null
  },
): Promise<RuleApplication> {
  const rules = await prisma.categorizationRule.findMany({
    where: { organizationId: orgId, enabled: true },
    orderBy: { priority: "asc" },
  })

  for (const rule of rules) {
    if (!ruleMatches(rule, draft)) continue

    return {
      categoryCode: rule.setCategoryCode || undefined,
      chartAccountId: rule.setChartAccountId || undefined,
      projectCode: rule.setProjectCode || undefined,
      taxRate: rule.setTaxId || undefined,
      appliedRuleId: rule.id,
      appliedRuleName: rule.name,
    }
  }

  return {}
}

function ruleMatches(
  rule: CategorizationRule,
  draft: {
    merchant?: string | null
    total?: number | null
    paymentMethod?: string | null
    contactId?: string | null
  },
): boolean {
  if (rule.merchantContains) {
    const m = (draft.merchant || "").toLowerCase()
    if (!m.includes(rule.merchantContains.toLowerCase())) return false
  }
  if (rule.amountMin != null && (draft.total ?? 0) < rule.amountMin) return false
  if (rule.amountMax != null && (draft.total ?? 0) > rule.amountMax) return false
  if (rule.paymentMethod && draft.paymentMethod !== rule.paymentMethod) return false
  if (rule.contactId && draft.contactId !== rule.contactId) return false
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve final transaction defaults — combines:
//   1. Category defaults (chart, tax, project)
//   2. Categorization rules (highest priority match wins)
//   3. Vendor memory (last-used by contact)
//
// Precedence: explicit user input > rule > category default > vendor memory
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveTransactionDefaults(
  orgId: string,
  draft: {
    merchant?: string | null
    total?: number | null
    paymentMethod?: string | null
    contactId?: string | null
    categoryCode?: string | null
    chartAccountId?: string | null
    projectCode?: string | null
    taxRate?: string | null
  },
): Promise<typeof draft & { _appliedRule?: string }> {
  const result = { ...draft }

  // Vendor memory (lowest precedence — only fills blanks)
  if (result.contactId) {
    const memory = await getVendorDefaults(orgId, result.contactId)
    if (!result.categoryCode && memory.categoryCode) result.categoryCode = memory.categoryCode
    if (!result.chartAccountId && memory.chartAccountId) result.chartAccountId = memory.chartAccountId
    if (!result.projectCode && memory.projectCode) result.projectCode = memory.projectCode
    if (!result.taxRate && memory.taxRate) result.taxRate = memory.taxRate
  }

  // Category defaults — when category is set, fill in chart/tax/project from category record
  if (result.categoryCode) {
    const cat = await prisma.category.findFirst({
      where: { organizationId: orgId, code: result.categoryCode },
      select: {
        defaultChartAccountId: true,
        defaultTaxId: true,
        defaultProjectCode: true,
      },
    })
    if (cat) {
      if (!result.chartAccountId && cat.defaultChartAccountId)
        result.chartAccountId = cat.defaultChartAccountId
      if (!result.taxRate && cat.defaultTaxId) result.taxRate = cat.defaultTaxId
      if (!result.projectCode && cat.defaultProjectCode) result.projectCode = cat.defaultProjectCode
    }
  }

  // Categorization rules (highest precedence among defaults — overrides blanks AND category defaults)
  const ruleResult = await applyCategorizationRules(orgId, result)
  let appliedRule: string | undefined
  if (ruleResult.appliedRuleId) {
    if (ruleResult.categoryCode) result.categoryCode = ruleResult.categoryCode
    if (ruleResult.chartAccountId) result.chartAccountId = ruleResult.chartAccountId
    if (ruleResult.projectCode) result.projectCode = ruleResult.projectCode
    if (ruleResult.taxRate) result.taxRate = ruleResult.taxRate
    appliedRule = ruleResult.appliedRuleName
  }

  return { ...result, _appliedRule: appliedRule }
}

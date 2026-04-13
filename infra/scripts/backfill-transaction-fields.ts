/**
 * One-time backfill: upserts new transaction Field rows into every existing
 * organization so the CPA-grade columns become visible by default.
 *
 * Run with: npx tsx infra/scripts/backfill-transaction-fields.ts
 *
 * Safe to re-run.
 */

import { PrismaClient } from "../../lib/prisma/client"
import { DEFAULT_FIELDS } from "../../lib/services/defaults"

const prisma = new PrismaClient()

// New fields added in Phase 1 — these need to be backfilled into existing orgs.
const NEW_FIELD_CODES = new Set([
  "number",
  "contactId",
  "chartAccountId",
  "bankAccountId",
  "paymentMethod",
  "reference",
  "status",
  "source",
  "reconciled",
  "taxAmount",
  "taxRate",
  "createdAt",
  "updatedAt",
])

async function main() {
  console.log("Starting backfill of transaction Field rows...\n")

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } })
  console.log(`Found ${orgs.length} organizations\n`)

  let totalCreated = 0
  let totalUpdated = 0

  for (const org of orgs) {
    let created = 0
    let updated = 0
    for (const field of DEFAULT_FIELDS) {
      if (!NEW_FIELD_CODES.has(field.code)) continue

      const result = await prisma.field.upsert({
        where: { organizationId_code: { code: field.code, organizationId: org.id } },
        create: { ...field, organizationId: org.id },
        update: {
          name: field.name,
          type: field.type,
          isVisibleInList: field.isVisibleInList,
          isVisibleInAnalysis: field.isVisibleInAnalysis,
          isRequired: field.isRequired,
          isExtra: field.isExtra,
        },
      })

      if (result.createdAt.getTime() > Date.now() - 5_000) {
        created++
      } else {
        updated++
      }
    }
    totalCreated += created
    totalUpdated += updated
    console.log(`[${org.name}] created ${created}, updated ${updated}`)
  }

  console.log(`\nDone — created ${totalCreated}, updated ${totalUpdated} field rows`)
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

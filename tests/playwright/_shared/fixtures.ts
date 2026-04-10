/**
 * Custom Playwright fixtures for Mintax tests.
 *
 * Usage:
 *   import { test, expect } from "@/tests/playwright/_shared/fixtures"
 *
 * Provides:
 *   - authedPage   → page with the pre-authenticated storageState
 *   - db           → raw pg Client connected to the test DB (auto-closed)
 *   - orgSlug      → resolves the test org slug from DB
 *   - seed.*       → helpers to create test records (cleaned up afterEach)
 */

import { test as base, expect, Page } from "@playwright/test"
import { Client } from "pg"
import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const AUTH_FILE = path.join(__dirname, "../.auth/user.json")

// ── Types ────────────────────────────────────────────────────────────────────

type SeedIds = {
  transactionIds: string[]
  invoiceIds: string[]
  contactIds: string[]
  categoryIds: string[]
}

type MintaxFixtures = {
  db: Client
  orgSlug: string
  orgId: string
  userId: string
  seed: SeedIds & {
    cleanup: () => Promise<void>
  }
}

// ── Test DB helper ────────────────────────────────────────────────────────────

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/mintax"

const TEST_EMAIL = process.env.TEST_EMAIL ?? "test@mintax.local"

// ── Fixtures ─────────────────────────────────────────────────────────────────

export const test = base.extend<MintaxFixtures>({
  /**
   * Connected pg Client – auto-closes after each test.
   */
  db: async ({}, use) => {
    const client = new Client({ connectionString: DATABASE_URL })
    await client.connect()
    await use(client)
    await client.end()
  },

  /**
   * The test user's DB id.
   */
  userId: async ({ db }, use) => {
    const { rows } = await db.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [TEST_EMAIL]
    )
    if (!rows.length) throw new Error(`Test user '${TEST_EMAIL}' not found in DB`)
    await use(rows[0].id)
  },

  /**
   * The first org the test user belongs to (slug used in URLs).
   */
  orgSlug: async ({ db, userId }, use) => {
    const { rows } = await db.query<{ slug: string }>(
      `SELECT o.slug
       FROM organizations o
       JOIN org_members m ON m.organization_id = o.id
       WHERE m.user_id = $1
       ORDER BY o.created_at ASC
       LIMIT 1`,
      [userId]
    )
    if (!rows.length) throw new Error("Test user has no organization")
    await use(rows[0].slug)
  },

  /**
   * The first org id the test user belongs to.
   */
  orgId: async ({ db, userId }, use) => {
    const { rows } = await db.query<{ id: string }>(
      `SELECT o.id
       FROM organizations o
       JOIN org_members m ON m.organization_id = o.id
       WHERE m.user_id = $1
       ORDER BY o.created_at ASC
       LIMIT 1`,
      [userId]
    )
    if (!rows.length) throw new Error("Test user has no organization")
    await use(rows[0].id)
  },

  /**
   * Seed helpers – creates records and tracks their IDs for cleanup.
   */
  seed: async ({ db, orgId, userId }, use) => {
    const ids: SeedIds = {
      transactionIds: [],
      invoiceIds: [],
      contactIds: [],
      categoryIds: [],
    }

    const cleanup = async () => {
      if (ids.invoiceIds.length) {
        await db.query(
          `DELETE FROM invoices WHERE id = ANY($1::uuid[])`,
          [ids.invoiceIds]
        )
      }
      if (ids.transactionIds.length) {
        await db.query(
          `DELETE FROM transactions WHERE id = ANY($1::uuid[])`,
          [ids.transactionIds]
        )
      }
      if (ids.contactIds.length) {
        await db.query(
          `DELETE FROM contacts WHERE id = ANY($1::uuid[])`,
          [ids.contactIds]
        )
      }
      if (ids.categoryIds.length) {
        await db.query(
          `DELETE FROM categories WHERE id = ANY($1::uuid[])`,
          [ids.categoryIds]
        )
      }
    }

    await use({ ...ids, cleanup })
    await cleanup()
  },
})

export { expect }
export const AUTH_FILE = path.resolve(
  __dirname,
  "../.auth/user.json"
)

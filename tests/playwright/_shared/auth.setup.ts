/**
 * Auth global setup for Playwright.
 *
 * Strategy: "natural developer" — trigger the OTP email via the real auth API,
 * then read the OTP directly from the `verification` table in the PostgreSQL DB
 * (same way a developer would check it in psql during manual testing).
 *
 * This creates tests/playwright/.auth/user.json with the storageState (cookies)
 * so all subsequent tests skip the login flow entirely.
 */

import { chromium, FullConfig } from "@playwright/test"
import { Client } from "pg"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:7331"
const TEST_EMAIL = process.env.TEST_EMAIL ?? "test@mintax.local"
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/mintax"
const AUTH_FILE = path.join(__dirname, "../.auth/user.json")

async function getOtpFromDb(email: string): Promise<string> {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  // better-auth stores OTP in the `verification` table.
  // `identifier` is the email and `value` is the hashed or plain OTP code.
  // Retry a few times while the OTP is being written.
  let otp: string | null = null
  for (let attempt = 0; attempt < 10; attempt++) {
    const result = await client.query<{ value: string }>(
      `SELECT value FROM verification
       WHERE identifier = $1
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    )
    if (result.rows.length > 0) {
      otp = result.rows[0].value
      break
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  await client.end()

  if (!otp) {
    throw new Error(
      `OTP not found in DB for ${email} after 5 seconds. ` +
        `Is the dev server running and the DB reachable?`
    )
  }
  return otp
}

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/signin`)

  // Step 1 – submit email (triggers OTP email + DB insert)
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByRole("button", { name: /continue|send otp|sign in|send login code/i }).click()

  // Step 2 – read OTP from DB
  const otp = await getOtpFromDb(TEST_EMAIL)
  console.log(`[auth.setup] OTP retrieved for ${TEST_EMAIL}`)

  // Step 3 – submit OTP in the UI
  // Handle both single-input and 6-boxed OTP fields
  const otpInput = page.getByLabel(/otp|code|pin/i).first()
  if (await otpInput.isVisible()) {
    await otpInput.fill(otp)
  } else {
    // If it's individual digit boxes (common pattern)
    const digits = otp.split("")
    const boxes = page.locator('input[type="text"]')
    for (let i = 0; i < digits.length; i++) {
      await boxes.nth(i).fill(digits[i])
    }
  }
  await page.getByRole("button", { name: /verify|confirm|sign in|verify code/i }).click()

  // Step 4 – wait until we're past sign-in (dashboard or org setup)
  await page.waitForURL(/\/(dashboard|setup-organization|organizations)/, {
    timeout: 15_000,
  })

  // Ensure directory exists
  if (!fs.existsSync(path.dirname(AUTH_FILE))) {
    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })
  }

  // Save signed-in state to 'storageState.json'
  await page.context().storageState({ path: AUTH_FILE })
  console.log(`[auth.setup] Storage state saved → ${AUTH_FILE}`)

  await browser.close()
}

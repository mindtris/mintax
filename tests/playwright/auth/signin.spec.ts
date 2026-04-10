/**
 * Auth – Sign-in tests
 *
 * These run WITHOUT storageState (the auth-tests project).
 * They test the actual sign-in flow a real user experiences.
 */

import { test, expect } from "@playwright/test"
import { Client } from "pg"
import { waitForPageLoad } from "../_shared/helpers"

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:7331"
const TEST_EMAIL = process.env.TEST_EMAIL ?? "test@mintax.local"
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/mintax"

test.describe("Sign-in flow", () => {
  test("sign-in page renders email input and submit button", async ({ page }) => {
    await page.goto("/signin")
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(
      page.getByRole("button", { name: /continue|sign in|send login code/i })
    ).toBeVisible()
  })

  test("shows validation error when submitting empty email", async ({ page }) => {
    await page.goto("/signin")
    await page.getByRole("button", { name: /continue|sign in|send login code/i }).click()
    // Expect either a browser validation tooltip or an inline error
    const emailInput = page.getByLabel(/email/i)
    const validationMsg = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    )
    const inlineError = page.locator("[role='alert'], .text-destructive, .text-red-500")
    const isValid = validationMsg === "" && !(await inlineError.isVisible())
    // If neither validation fires, the form should NOT have navigated away
    expect(page.url()).toContain("/signin")
    expect(isValid).toBe(false)
  })

  test("shows validation error for malformed email", async ({ page }) => {
    await page.goto("/signin")
    await page.getByLabel(/email/i).fill("notanemail")
    await page.getByRole("button", { name: /continue|sign in|send login code/i }).click()
    expect(page.url()).toContain("/signin")
  })

  test("full sign-in flow: email → OTP from DB → authenticated", async ({ page }) => {
    await page.goto("/signin")

    // Step 1: enter email
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByRole("button", { name: /continue|sign in|send login code/i }).click()

    // Step 2: read OTP from DB
    const db = new Client({ connectionString: DATABASE_URL })
    await db.connect()
    let otp: string | null = null
    for (let i = 0; i < 10; i++) {
      const { rows } = await db.query<{ value: string }>(
        `SELECT value FROM verification
         WHERE identifier = $1 AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [TEST_EMAIL]
      )
      if (rows.length) { otp = rows[0].value; break }
      await new Promise((r) => setTimeout(r, 500))
    }
    await db.end()
    expect(otp, "OTP must exist in DB after triggering sign-in").toBeTruthy()

    // Step 3: fill OTP
    const otpInput = page.getByLabel(/otp|code|pin/i).first()
    if (await otpInput.isVisible()) {
      await otpInput.fill(otp!)
    } else {
      const digits = otp!.split("")
      for (let i = 0; i < digits.length; i++) {
        await page.locator('input[type="text"]').nth(i).fill(digits[i])
      }
    }
    await page.getByRole("button", { name: /verify|confirm|sign in|verify code/i }).click()

    // Step 4: must land on an authenticated page
    await page.waitForURL(/\/(dashboard|setup-organization|organizations)/, {
      timeout: 15_000,
    })
    await waitForPageLoad(page)
    expect(page.url()).not.toContain("/signin")
  })

  test("unauthenticated access to /dashboard redirects to sign-in", async ({
    browser,
  }) => {
    // Fresh context with no cookies
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto("/dashboard")
    await page.waitForURL(/\/signin/)
    expect(page.url()).toContain("/signin")
    await ctx.close()
  })
})

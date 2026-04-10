/**
 * Auth – Self-hosted PIN tests
 *
 * These verify the middleware's self-hosted PIN gate.
 * Requires: SELF_HOSTED_PIN env var set in the running server.
 * If SELF_HOSTED_PIN is not configured, tests are skipped.
 */

import { test, expect } from "@playwright/test"

const SELF_HOSTED_PIN = process.env.SELF_HOSTED_PIN
const SELF_HOSTED_PIN_COOKIE = "mintax_sh_auth"

test.describe("Self-hosted PIN gate", () => {
  test.beforeAll(() => {
    if (!SELF_HOSTED_PIN) {
      test.skip()
    }
  })

  test("accessing /dashboard without PIN cookie redirects to /self-hosted", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: undefined })
    const page = await ctx.newPage()
    await page.goto("/dashboard")
    await page.waitForURL(/\/self-hosted/)
    expect(page.url()).toContain("/self-hosted")
    await ctx.close()
  })

  test("self-hosted page renders a PIN input form", async ({ page }) => {
    await page.goto("/self-hosted")
    // Should have some kind of PIN input
    const pinInput = page.locator('input[type="password"], input[type="text"], input[type="number"]').first()
    await expect(pinInput).toBeVisible()
  })

  test("wrong PIN stays on /self-hosted or shows error", async ({ page }) => {
    await page.goto("/self-hosted")
    const pinInput = page.locator('input[type="password"], input[type="text"], input[type="number"]').first()
    await pinInput.fill("000000")
    await page.getByRole("button", { name: /submit|enter|access|unlock/i }).click()
    await page.waitForTimeout(1000)
    expect(page.url()).toContain("/self-hosted")
  })

  test("correct PIN sets cookie and allows access to /dashboard", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: undefined })
    const page = await ctx.newPage()
    await page.goto("/self-hosted")
    const pinInput = page.locator('input[type="password"], input[type="text"], input[type="number"]').first()
    await pinInput.fill(SELF_HOSTED_PIN!)
    await page.getByRole("button", { name: /submit|enter|access|unlock/i }).click()
    // After correct PIN, should redirect to app or set cookie
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    expect(page.url()).toContain("/dashboard")
    // Verify cookie was set
    const cookies = await ctx.cookies()
    const pinCookie = cookies.find((c) => c.name === SELF_HOSTED_PIN_COOKIE)
    expect(pinCookie?.value).toBe(SELF_HOSTED_PIN)
    await ctx.close()
  })
})

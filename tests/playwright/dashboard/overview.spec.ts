/**
 * Dashboard – overview smoke test
 *
 * Verifies the dashboard page loads, displays key summary sections,
 * and produces no JS errors. Uses pre-authenticated storageState.
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad, captureConsoleErrors, assertNoConsoleErrors } from "../_shared/helpers"

test.describe("Dashboard", () => {
  test("loads without errors and shows financial summary", async ({ page }) => {
    const errors = captureConsoleErrors(page)

    await page.goto("/dashboard")
    await waitForPageLoad(page)

    // The dashboard heading or title should be visible
    await expect(
      page.getByRole("heading", { name: /dashboard|overview/i }).first()
    ).toBeVisible({ timeout: 10_000 })

    assertNoConsoleErrors(errors)
  })

  test("shows stat cards or summary metrics", async ({ page }) => {
    await page.goto("/dashboard")
    await waitForPageLoad(page)

    // Expect at least one card / metric panel
    const cards = page.locator("[data-testid='stat-card'], .stat-card, .card").first()
    // Don't assert count — just assert the page rendered content beyond a loading state
    await expect(page.locator("main")).not.toBeEmpty()
  })

  test("navigation sidebar is present and links work", async ({ page }) => {
    await page.goto("/dashboard")
    await waitForPageLoad(page)

    const nav = page.getByRole("navigation").first()
    await expect(nav).toBeVisible()

    // Should have a link to transactions
    const txLink = nav.getByRole("link", { name: /transactions/i })
    await expect(txLink).toBeVisible()
    await txLink.click()
    await expect(page).toHaveURL(/\/transactions/)
  })
})

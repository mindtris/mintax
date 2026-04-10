/**
 * Engage
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Engage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/engage")
    await waitForPageLoad(page)
  })

  test("engage dashboard loads", async ({ page }) => {
    await expect(page.getByText(/social|engage|marketing/i)).not.toBeEmpty()
  })
})

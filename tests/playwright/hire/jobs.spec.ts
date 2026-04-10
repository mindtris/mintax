/**
 * Hire / ATS
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Hire / ATS", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hire")
    await waitForPageLoad(page)
  })

  test("job postings list", async ({ page }) => {
    await expect(page.getByText(/jobs|postings|hiring/i)).not.toBeEmpty()
  })

  test("job pipeline / candidates", async ({ page }) => {
    const pipeline = page.getByRole("link", { name: /pipeline|candidates/i })
    if (await pipeline.isVisible()) {
        await pipeline.click()
        await expect(page).toHaveURL(/\/pipeline|\/candidates/)
    }
  })
})

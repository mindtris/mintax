/**
 * Unsorted Documents
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Unsorted Documents", () => {
  test("unsorted page loads", async ({ page }) => {
    await page.goto("/unsorted")
    await waitForPageLoad(page)
    await expect(page.getByRole("heading", { name: /unsorted/i })).toBeVisible()
  })

  test("upload document button is present", async ({ page }) => {
    await page.goto("/unsorted")
    await waitForPageLoad(page)
    await expect(page.getByRole("button", { name: /upload|add/i }).first()).toBeVisible()
  })
  
  test.skip("AI extraction UI", async ({ page }) => {
    // // LLM not configured — unskip when API keys are wired
  })
})

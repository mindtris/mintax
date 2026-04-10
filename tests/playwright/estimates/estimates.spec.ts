/**
 * Estimates – Management
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad, expectToast, fillField } from "../_shared/helpers"

const UNIQUE_ESTIMATE = `Test Estimate ${Date.now()}`

test.describe("Estimates", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/estimates")
    await waitForPageLoad(page)
  })

  test("list estimates", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /estimates/i })).toBeVisible()
  })

  test("create an estimate", async ({ page }) => {
    await page.getByRole("button", { name: /new|add/i }).first().click()

    await fillField(page, "client name", UNIQUE_ESTIMATE)
    
    await page.getByRole("button", { name: /save|create/i }).last().click()
    
    await expectToast(page, /saved|created/i)
    await expect(page.getByText(UNIQUE_ESTIMATE)).toBeVisible()
  })
})

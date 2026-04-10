/**
 * Bills – Management
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad, expectToast, fillField } from "../_shared/helpers"

const UNIQUE_BILL = `Test Bill ${Date.now()}`

test.describe("Bills", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bills")
    await waitForPageLoad(page)
  })

  test("list bills", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /bills/i })).toBeVisible()
  })

  test("create a bill", async ({ page }) => {
    await page.getByRole("button", { name: /new|add/i }).first().click()

    await fillField(page, "vendor|merchant|name", UNIQUE_BILL)
    await fillField(page, "amount", "500")

    await page.getByRole("button", { name: /save|create/i }).last().click()
    
    await expectToast(page, /saved|created/i)
    await expect(page.getByText(UNIQUE_BILL)).toBeVisible()
  })
})

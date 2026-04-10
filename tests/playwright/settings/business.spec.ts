/**
 * Settings
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad, expectToast, fillField } from "../_shared/helpers"

test.describe("Settings", () => {
  test("business info page loads", async ({ page }) => {
    await page.goto("/settings/business")
    await waitForPageLoad(page)
    await expect(page.getByRole("heading", { name: /business|info/i })).toBeVisible()
  })

  test("update business name", async ({ page }) => {
    await page.goto("/settings/business")
    await waitForPageLoad(page)
    
    const businessName = page.getByLabel(/business name|company name/i).first()
    const originalValue = await businessName.inputValue()
    const newValue = `${originalValue} TEST`
    
    await businessName.fill(newValue)
    await page.getByRole("button", { name: /save|update/i }).first().click()
    
    await expectToast(page, /saved|updated/i)
    
    // Revert
    await businessName.fill(originalValue)
    await page.getByRole("button", { name: /save|update/i }).first().click()
  })

  test("categories settings", async ({ page }) => {
    await page.goto("/settings/categories")
    await waitForPageLoad(page)
    await expect(page.getByText(/categories/i).first()).toBeVisible()
  })

  test("taxes settings", async ({ page }) => {
    await page.goto("/settings/taxes")
    await waitForPageLoad(page)
    await expect(page.getByText(/taxes/i).first()).toBeVisible()
  })

  test("currencies settings", async ({ page }) => {
    await page.goto("/settings/currencies")
    await waitForPageLoad(page)
    await expect(page.getByText(/currencies/i).first()).toBeVisible()
  })

  test("LLM settings", async ({ page }) => {
    await page.goto("/settings/llm")
    await waitForPageLoad(page)
    await expect(page.getByText(/llm|ai|model/i).first()).toBeVisible()
  })
})

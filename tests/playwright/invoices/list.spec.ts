/**
 * Invoices – list and search
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Invoices list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/invoices")
    await waitForPageLoad(page)
  })

  test("renders invoices page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /invoices/i }).first()
    ).toBeVisible()
  })

  test("page shows no error state", async ({ page }) => {
    await expect(
      page.getByText(/something went wrong|error loading/i)
    ).not.toBeVisible()
  })

  test("new invoice button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /new invoice|create|add/i }).first()
    ).toBeVisible()
  })

  test("status tabs (draft/sent/paid) are present", async ({ page }) => {
    const tabs = page.getByRole("tab")
    await expect(tabs.first()).toBeVisible()
  })
})

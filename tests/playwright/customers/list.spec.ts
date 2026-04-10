/**
 * Customers – list
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Customers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customers")
    await waitForPageLoad(page)
  })

  test("list customers / contacts", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /customers|contacts/i })).toBeVisible()
  })

  test("tabs for clients and vendors", async ({ page }) => {
    const clientsTab = page.getByRole("tab", { name: /clients/i })
    const vendorsTab = page.getByRole("tab", { name: /vendors/i })
    
    if (await clientsTab.isVisible()) {
        await clientsTab.click()
        await expect(clientsTab).toHaveAttribute("aria-selected", "true")
    }
    
    if (await vendorsTab.isVisible()) {
        await vendorsTab.click()
        await expect(vendorsTab).toHaveAttribute("aria-selected", "true")
    }
  })
})

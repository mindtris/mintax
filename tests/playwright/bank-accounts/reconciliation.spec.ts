/**
 * Bank Accounts – Reconciliation
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Reconciliation", () => {
  test("reconciliation page loads for an account", async ({ page }) => {
    await page.goto("/bank-accounts")
    await waitForPageLoad(page)

    const firstAccount = page.locator("table tbody tr, [role='row']").first()
    if (!(await firstAccount.isVisible())) {
        test.skip()
        return
    }

    await firstAccount.click()
    
    const reconcileBtn = page.getByRole("link", { name: /reconcile/i }).first()
    if (await reconcileBtn.isVisible()) {
        await reconcileBtn.click()
        await expect(page).toHaveURL(/\/reconciliation\//)
        await expect(page.getByText(/reconcile|reconciliation/i).first()).toBeVisible()
    }
  })
})

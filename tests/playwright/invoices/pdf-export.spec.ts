/**
 * Invoices – PDF Export
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Invoice PDF Export", () => {
  test("downloading PDF triggers file response", async ({ page }) => {
    await page.goto("/invoices")
    await waitForPageLoad(page)

    const firstInvoice = page.locator("table tbody tr, [role='row']").first()
    if (!(await firstInvoice.isVisible())) {
        test.skip()
        return
    }

    await firstInvoice.click()

    // Find PDF download button
    const downloadBtn = page.getByRole("button", { name: /pdf|download|export/i }).first()
    if (!(await downloadBtn.isVisible())) {
        test.skip()
        return
    }

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadBtn.click()
    ])

    expect(download.suggestedFilename()).toContain(".pdf")
  })
})

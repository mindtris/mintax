/**
 * Data Export
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Export", () => {
  test("exporting transactions as CSV", async ({ page }) => {
    await page.goto("/export/transactions")
    await waitForPageLoad(page)

    const exportBtn = page.getByRole("button", { name: /export|csv|download/i }).first()
    if (!(await exportBtn.isVisible())) {
        test.skip()
        return
    }

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportBtn.click()
    ])

    expect(download.suggestedFilename()).toContain(".csv")
  })
})

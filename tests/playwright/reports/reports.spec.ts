/**
 * Reports – list
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Reports", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports")
    await waitForPageLoad(page)
  })

  test("reports dashboard loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /reports/i })).toBeVisible()
  })

  test("financial charts are rendered", async ({ page }) => {
    const charts = page.locator("canvas, .chart-container")
    // Should have at least one chart or a message if no data
    const hasCharts = await charts.count() > 0
    const noData = await page.getByText(/no data/i).isVisible()
    
    expect(hasCharts || noData).toBe(true)
  })
})

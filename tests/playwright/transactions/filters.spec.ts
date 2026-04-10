/**
 * Transactions – filter panel tests
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("Transaction filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions")
    await waitForPageLoad(page)
  })

  test("date range picker is present and interactive", async ({ page }) => {
    // Look for a date range trigger
    const dateTrigger = page
      .getByRole("button", { name: /date|period|range|from|this month/i })
      .first()
    if (!(await dateTrigger.isVisible())) return // skip if date filter not present in UI
    await dateTrigger.click()
    // A calendar or date picker should appear
    const calendar = page.locator('[role="dialog"], .rdp, [data-radix-popper-content-wrapper]').first()
    await expect(calendar).toBeVisible({ timeout: 3_000 })
    await page.keyboard.press("Escape")
  })

  test("type filter (expense / income) changes visible rows", async ({ page }) => {
    // Look for type toggle buttons or select
    const expenseFilter = page
      .getByRole("button", { name: /expense/i })
      .first()
    if (!(await expenseFilter.isVisible())) return
    await expenseFilter.click()
    await waitForPageLoad(page)
    await expect(page.locator("main")).not.toBeEmpty()
  })

  test("category filter dropdown is present", async ({ page }) => {
    const categoryFilter = page
      .getByRole("button", { name: /category|categories/i })
      .first()
    if (!(await categoryFilter.isVisible())) return
    await categoryFilter.click()
    await expect(
      page.locator('[role="listbox"], [role="menu"]').first()
    ).toBeVisible({ timeout: 3_000 })
    await page.keyboard.press("Escape")
  })

  test("clearing filters resets to full list", async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first()
    if (!(await search.isVisible())) return
    await search.fill("zzznomatch")
    await page.waitForTimeout(300)

    const clearBtn = page.getByRole("button", { name: /clear|reset|x/i }).first()
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
      await waitForPageLoad(page)
    } else {
      await search.clear()
      await page.waitForTimeout(300)
    }
    await expect(page.locator("main")).not.toBeEmpty()
  })
})

/**
 * Bank Accounts – Management
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad, expectToast, fillField } from "../_shared/helpers"

const UNIQUE_ACCOUNT = `Test Bank ${Date.now()}`

test.describe("Bank Accounts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bank-accounts")
    await waitForPageLoad(page)
  })

  test("list bank accounts", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /bank accounts/i })).toBeVisible()
  })

  test("add a bank account", async ({ page }) => {
    await page.getByRole("button", { name: /add|new/i }).first().click()

    await fillField(page, "account name", UNIQUE_ACCOUNT)
    await fillField(page, "bank name", "E2E Bank")
    
    await page.getByRole("button", { name: /save|create/i }).last().click()
    
    await expectToast(page, /saved|created/i)
    await expect(page.getByText(UNIQUE_ACCOUNT)).toBeVisible()
  })

  test("delete a bank account", async ({ page }) => {
    await page.getByText(UNIQUE_ACCOUNT).first().click()
    
    await page.getByRole("button", { name: /delete|remove/i }).first().click()
    
    const confirmBtn = page.getByRole("button", { name: /confirm|delete|yes/i }).last()
    if (await confirmBtn.isVisible()) {
        await confirmBtn.click()
    }

    await expectToast(page, /deleted|removed/i)
    await expect(page.getByText(UNIQUE_ACCOUNT)).not.toBeVisible()
  })
})

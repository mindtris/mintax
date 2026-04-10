/**
 * Invoices – CRUD
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad, expectToast, fillField, selectOption } from "../_shared/helpers"

const UNIQUE_CLIENT = `E2E Client ${Date.now()}`

test.describe("Invoices CRUD", () => {
  test("create a new invoice", async ({ page }) => {
    await page.goto("/invoices")
    await waitForPageLoad(page)

    await page.getByRole("button", { name: /new invoice|create/i }).first().click()

    // Fill invoice details
    await fillField(page, "client name", UNIQUE_CLIENT)
    
    // Add an item if the UI allows
    const addItemBtn = page.getByRole("button", { name: /add item|add row/i }).first()
    if (await addItemBtn.isVisible()) {
        await addItemBtn.click()
        await page.locator('input[name*="description"], [placeholder*="description"]').last().fill("Test Item")
        await page.locator('input[name*="quantity"], [placeholder*="qty"]').last().fill("1")
        await page.locator('input[name*="price"], [placeholder*="price"]').last().fill("100")
    }

    await page.getByRole("button", { name: /save|create/i }).last().click()

    await expectToast(page, /saved|created/i)
    
    await expect(page.getByText(UNIQUE_CLIENT)).toBeVisible({ timeout: 10000 })
  })

  test("edit an invoice", async ({ page }) => {
    await page.goto("/invoices")
    await waitForPageLoad(page)

    await page.getByText(UNIQUE_CLIENT).first().click()
    
    const editedClient = `${UNIQUE_CLIENT} EDITED`
    await fillField(page, "client name", editedClient)

    await page.getByRole("button", { name: /save|update/i }).last().click()
    await expectToast(page, /saved|updated/i)

    await expect(page.getByText(editedClient)).toBeVisible({ timeout: 10000 })
  })

  test("delete an invoice", async ({ page }) => {
    await page.goto("/invoices")
    await waitForPageLoad(page)

    await page.getByText(UNIQUE_CLIENT).first().click()
    
    await page.getByRole("button", { name: /delete|remove/i }).first().click()
    
    // Confirm dialog
    const confirmBtn = page.getByRole("button", { name: /confirm|delete|yes/i }).last()
    if (await confirmBtn.isVisible()) {
        await confirmBtn.click()
    }

    await expectToast(page, /deleted|removed/i)
    await expect(page.getByText(UNIQUE_CLIENT)).not.toBeVisible()
  })
})

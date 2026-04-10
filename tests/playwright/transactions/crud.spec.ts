/**
 * Transactions – CRUD (create, edit, delete)
 *
 * Creates a transaction via the UI, edits it, then deletes it.
 * No mocking — real server actions run against the real DB.
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad, expectToast, confirmDialog } from "../_shared/helpers"

const UNIQUE_NAME = `E2E Transaction ${Date.now()}`

test.describe("Transactions CRUD", () => {
  test("create a new transaction via UI", async ({ page }) => {
    await page.goto("/transactions")
    await waitForPageLoad(page)

    // Find and click the "New" / "Add" button
    const addBtn = page
      .getByRole("button", { name: /new|add transaction|create/i })
      .first()
    await expect(addBtn).toBeVisible()
    await addBtn.click()

    // Fill in the form (dialog or inline form)
    const nameInput = page
      .getByLabel(/name|description|merchant/i)
      .first()
    await nameInput.fill(UNIQUE_NAME)

    // Amount
    const amountInput = page.getByLabel(/amount|total/i).first()
    await amountInput.fill("100")

    // Save
    await page
      .getByRole("button", { name: /save|create|add/i })
      .last()
      .click()

    // Expect a success toast or navigation back to list
    await expectToast(page, /saved|created|added/i)

    // Verify transaction appears in the list
    await page.goto("/transactions")
    await waitForPageLoad(page)
    await expect(page.getByText(UNIQUE_NAME)).toBeVisible({ timeout: 10_000 })
  })

  test("edit an existing transaction", async ({ page }) => {
    await page.goto("/transactions")
    await waitForPageLoad(page)

    // Find our created transaction
    const txRow = page.getByText(UNIQUE_NAME).first()
    const hasRow = await txRow.isVisible()
    if (!hasRow) {
      test.skip() // Depends on create test passing first
      return
    }
    await txRow.click()

    const editedName = `${UNIQUE_NAME} EDITED`
    const nameInput = page.getByLabel(/name|description|merchant/i).first()
    await nameInput.clear()
    await nameInput.fill(editedName)

    await page.getByRole("button", { name: /save|update/i }).last().click()
    await expectToast(page, /saved|updated/i)

    await page.goto("/transactions")
    await waitForPageLoad(page)
    await expect(page.getByText(editedName)).toBeVisible({ timeout: 10_000 })
  })

  test("delete a transaction", async ({ page }) => {
    await page.goto("/transactions")
    await waitForPageLoad(page)

    const txRow = page
      .getByText(new RegExp(`${UNIQUE_NAME}( EDITED)?`))
      .first()
    const hasRow = await txRow.isVisible()
    if (!hasRow) {
      test.skip()
      return
    }
    await txRow.click()

    // Click delete button (inside dialog or detail panel)
    await page
      .getByRole("button", { name: /delete|remove/i })
      .first()
      .click()

    // Confirm deletion dialog if it appears
    const dialog = page.getByRole("dialog")
    if (await dialog.isVisible()) {
      await dialog.getByRole("button", { name: /delete|confirm|yes/i }).click()
    }

    await expectToast(page, /deleted|removed/i)

    await page.goto("/transactions")
    await waitForPageLoad(page)
    await expect(
      page.getByText(new RegExp(`${UNIQUE_NAME}( EDITED)?`))
    ).not.toBeVisible()
  })
})

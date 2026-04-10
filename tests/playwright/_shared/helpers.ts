/**
 * Shared test helpers for Mintax Playwright tests.
 */

import { Page, expect } from "@playwright/test"

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Navigate to a route and wait for it to be fully loaded (no spinner).
 */
export async function goto(page: Page, path: string) {
  await page.goto(path)
  await waitForPageLoad(page)
}

/**
 * Wait for any loading spinners / skeleton screens to disappear.
 */
export async function waitForPageLoad(page: Page) {
  // Wait for network to settle
  await page.waitForLoadState("networkidle")
  // Wait for any loading spinner to disappear (if present)
  const spinner = page.locator('[data-testid="loading"], .animate-spin').first()
  if (await spinner.isVisible()) {
    await spinner.waitFor({ state: "hidden", timeout: 10_000 })
  }
}

// ── Assertions ────────────────────────────────────────────────────────────────

/**
 * Assert page has no uncaught JS errors logged to console (attach listener before navigation).
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  page.on("pageerror", (err) => errors.push(err.message))
  return errors
}

/**
 * Assert no console errors were captured (call after the test action).
 */
export function assertNoConsoleErrors(errors: string[]) {
  expect(errors, `Unexpected console errors: ${errors.join(" | ")}`).toHaveLength(0)
}

// ── Forms ─────────────────────────────────────────────────────────────────────

/**
 * Fill a form field using its label text (case-insensitive).
 */
export async function fillField(page: Page, label: string, value: string) {
  await page.getByLabel(new RegExp(label, "i")).fill(value)
}

/**
 * Select an option in a <select> or Radix Select by label + option text.
 */
export async function selectOption(
  page: Page,
  triggerLabel: string,
  optionText: string
) {
  await page.getByLabel(new RegExp(triggerLabel, "i")).click()
  await page.getByRole("option", { name: new RegExp(optionText, "i") }).click()
}

// ── Toasts / Notifications ───────────────────────────────────────────────────

/**
 * Wait for a toast/sonner notification containing the given text.
 */
export async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.locator(`[data-sonner-toast]`).filter({ hasText: text })
  await expect(toast).toBeVisible({ timeout: 8_000 })
}

// ── Tables / Lists ────────────────────────────────────────────────────────────

/**
 * Return true if the given text appears somewhere in the page's data table.
 */
export async function tableContains(page: Page, text: string): Promise<boolean> {
  const rows = page.locator("table tbody tr, [role='row']")
  const count = await rows.count()
  for (let i = 0; i < count; i++) {
    const rowText = await rows.nth(i).textContent()
    if (rowText?.includes(text)) return true
  }
  return false
}

// ── Dialogs ───────────────────────────────────────────────────────────────────

/**
 * Click a dialog's primary confirm/submit button.
 */
export async function confirmDialog(page: Page, buttonLabel: RegExp = /confirm|yes|delete|save/i) {
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: buttonLabel }).click()
}

// ── File Upload ───────────────────────────────────────────────────────────────

/**
 * Upload a file to an <input type="file"> by its accessible label or test id.
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
) {
  const input = page.locator(selector)
  await input.setInputFiles(filePath)
}

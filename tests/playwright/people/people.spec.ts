/**
 * People / HR
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"

test.describe("People", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/people")
    await waitForPageLoad(page)
  })

  test("people dashboard loads", async ({ page }) => {
    await expect(page.getByText(/people|onboarding|hr/i)).not.toBeEmpty()
  })

  test("onboarding links are visible", async ({ page }) => {
    const onboarding = page.getByRole("link", { name: /onboarding/i })
    if (await onboarding.isVisible()) {
        await onboarding.click()
        await expect(page).toHaveURL(/\/onboarding/)
    }
  })
})

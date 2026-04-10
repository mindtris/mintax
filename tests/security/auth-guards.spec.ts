/**
 * Security – Auth Guards
 */

import { test, expect } from "@playwright/test"

test.describe("Security Auth Guards", () => {
  const protectedRoutes = [
    "/transactions",
    "/settings",
    "/export",
    "/import",
    "/unsorted",
    "/files",
    "/dashboard",
    "/organizations",
    "/bank-accounts",
    "/invoices",
    "/reconciliation",
    "/reports",
    "/apps",
    "/engage",
    "/customers",
    "/people",
    "/hire",
    "/reminders",
    "/setup-organization",
  ]

  for (const route of protectedRoutes) {
    test(`unauthenticated access to ${route} redirects to signin`, async ({ browser }) => {
      // Use a new context without any state
      const context = await browser.newContext({ storageState: undefined })
      const page = await context.newPage()
      
      await page.goto(route)
      // Should redirect to signin
      await page.waitForURL(/\/signin|auth|self-hosted/)
      expect(page.url()).toContain("signin")
      
      await context.close()
    })
  }

  test("direct API access without session returns 401 or redirect", async ({ request }) => {
    const response = await request.get("/api/org")
    // Should be 401 Unauthorized or 307/302 redirect
    expect([401, 307, 302]).toContain(response.status())
  })
})

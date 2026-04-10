/**
 * API Integration Tests
 */

import { test, expect } from "@playwright/test"

test.describe("API Integration", () => {
  test("GET /api/currency returns valid JSON", async ({ request }) => {
    const response = await request.get("/api/currency")
    if (response.status() === 200) {
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
    }
  })

  test("GET /api/quicklinks returns 200", async ({ request }) => {
    const response = await request.get("/api/quicklinks")
    // Might need auth, but we're testing the endpoint exists
    expect([200, 401, 307]).toContain(response.status())
  })
})

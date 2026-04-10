import { defineConfig, devices } from "@playwright/test"
import dotenv from "dotenv"
import path from "path"

dotenv.config()

/**
 * Mintax Playwright configuration
 * Target: http://localhost:7331 (local dev server)
 * Auth: cloud mode (better-auth, email OTP read from DB in global setup)
 *
 * Run: npx playwright test
 * UI:  npx playwright test --ui
 */
export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "tests/playwright-report" }], ["list"]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:7331",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // ── Global auth setup (runs once before all tests) ────────────────────────
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // ── Chromium ──────────────────────────────────────────────────────────────
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // ── Firefox ───────────────────────────────────────────────────────────────
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "tests/playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // ── Auth tests run WITHOUT storageState (they test the login flow itself) ─
    {
      name: "auth-tests",
      testMatch: /auth\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // No storageState – these test the sign-in flow itself
      },
      dependencies: ["setup"],
    },

    // ── Security tests ────────────────────────────────────────────────────────
    {
      name: "security",
      testMatch: /.*security.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // No storageState – security tests verify unauthenticated access is blocked
      },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:7331",
    reuseExistingServer: true, // don't restart if already running
    timeout: 120_000,
  },
})

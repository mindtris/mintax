# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\signin.spec.ts >> Sign-in flow >> shows validation error for malformed email
- Location: tests\playwright\auth\signin.spec.ts:42:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:7331/signin", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * Auth – Sign-in tests
  3   |  *
  4   |  * These run WITHOUT storageState (the auth-tests project).
  5   |  * They test the actual sign-in flow a real user experiences.
  6   |  */
  7   | 
  8   | import { test, expect } from "@playwright/test"
  9   | import { Client } from "pg"
  10  | import { waitForPageLoad } from "../_shared/helpers"
  11  | 
  12  | const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:7331"
  13  | const TEST_EMAIL = process.env.TEST_EMAIL ?? "test@mintax.local"
  14  | const DATABASE_URL =
  15  |   process.env.DATABASE_URL ??
  16  |   "postgresql://postgres:postgres@localhost:5433/mintax"
  17  | 
  18  | test.describe("Sign-in flow", () => {
  19  |   test("sign-in page renders email input and submit button", async ({ page }) => {
  20  |     await page.goto("/signin")
  21  |     await expect(page.getByLabel(/email/i)).toBeVisible()
  22  |     await expect(
  23  |       page.getByRole("button", { name: /continue|sign in|send login code/i })
  24  |     ).toBeVisible()
  25  |   })
  26  | 
  27  |   test("shows validation error when submitting empty email", async ({ page }) => {
  28  |     await page.goto("/signin")
  29  |     await page.getByRole("button", { name: /continue|sign in|send login code/i }).click()
  30  |     // Expect either a browser validation tooltip or an inline error
  31  |     const emailInput = page.getByLabel(/email/i)
  32  |     const validationMsg = await emailInput.evaluate(
  33  |       (el: HTMLInputElement) => el.validationMessage
  34  |     )
  35  |     const inlineError = page.locator("[role='alert'], .text-destructive, .text-red-500")
  36  |     const isValid = validationMsg === "" && !(await inlineError.isVisible())
  37  |     // If neither validation fires, the form should NOT have navigated away
  38  |     expect(page.url()).toContain("/signin")
  39  |     expect(isValid).toBe(false)
  40  |   })
  41  | 
  42  |   test("shows validation error for malformed email", async ({ page }) => {
> 43  |     await page.goto("/signin")
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  44  |     await page.getByLabel(/email/i).fill("notanemail")
  45  |     await page.getByRole("button", { name: /continue|sign in|send login code/i }).click()
  46  |     expect(page.url()).toContain("/signin")
  47  |   })
  48  | 
  49  |   test("full sign-in flow: email → OTP from DB → authenticated", async ({ page }) => {
  50  |     await page.goto("/signin")
  51  | 
  52  |     // Step 1: enter email
  53  |     await page.getByLabel(/email/i).fill(TEST_EMAIL)
  54  |     await page.getByRole("button", { name: /continue|sign in|send login code/i }).click()
  55  | 
  56  |     // Step 2: read OTP from DB
  57  |     const db = new Client({ connectionString: DATABASE_URL })
  58  |     await db.connect()
  59  |     let otp: string | null = null
  60  |     for (let i = 0; i < 10; i++) {
  61  |       const { rows } = await db.query<{ value: string }>(
  62  |         `SELECT value FROM verification
  63  |          WHERE identifier = $1 AND expires_at > NOW()
  64  |          ORDER BY created_at DESC LIMIT 1`,
  65  |         [TEST_EMAIL]
  66  |       )
  67  |       if (rows.length) { otp = rows[0].value; break }
  68  |       await new Promise((r) => setTimeout(r, 500))
  69  |     }
  70  |     await db.end()
  71  |     expect(otp, "OTP must exist in DB after triggering sign-in").toBeTruthy()
  72  | 
  73  |     // Step 3: fill OTP
  74  |     const otpInput = page.getByLabel(/otp|code|pin/i).first()
  75  |     if (await otpInput.isVisible()) {
  76  |       await otpInput.fill(otp!)
  77  |     } else {
  78  |       const digits = otp!.split("")
  79  |       for (let i = 0; i < digits.length; i++) {
  80  |         await page.locator('input[type="text"]').nth(i).fill(digits[i])
  81  |       }
  82  |     }
  83  |     await page.getByRole("button", { name: /verify|confirm|sign in|verify code/i }).click()
  84  | 
  85  |     // Step 4: must land on an authenticated page
  86  |     await page.waitForURL(/\/(dashboard|setup-organization|organizations)/, {
  87  |       timeout: 15_000,
  88  |     })
  89  |     await waitForPageLoad(page)
  90  |     expect(page.url()).not.toContain("/signin")
  91  |   })
  92  | 
  93  |   test("unauthenticated access to /dashboard redirects to sign-in", async ({
  94  |     browser,
  95  |   }) => {
  96  |     // Fresh context with no cookies
  97  |     const ctx = await browser.newContext()
  98  |     const page = await ctx.newPage()
  99  |     await page.goto("/dashboard")
  100 |     await page.waitForURL(/\/signin/)
  101 |     expect(page.url()).toContain("/signin")
  102 |     await ctx.close()
  103 |   })
  104 | })
  105 | 
```
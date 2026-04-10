/**
 * CSV Import
 */

import { test, expect } from "@playwright/test"
import { waitForPageLoad } from "../_shared/helpers"
import * as path from "path"
import * as fs from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe("CSV Import", () => {
  test("import page loads and accepts file", async ({ page }) => {
    await page.goto("/import/csv")
    await waitForPageLoad(page)

    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeVisible()

    // Create a dummy CSV
    const csvPath = path.join(__dirname, "test.csv")
    fs.writeFileSync(csvPath, "date,description,amount\n2024-01-01,Test Transaction,100")
    
    await fileInput.setInputFiles(csvPath)
    
    // Check if preview appears
    await expect(page.getByText(/preview|confirm/i)).toBeVisible({ timeout: 10000 })
    
    // Cleanup
    fs.unlinkSync(csvPath)
  })
})

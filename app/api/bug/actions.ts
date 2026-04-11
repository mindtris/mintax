"use server"

import { put } from "@vercel/blob"
import config from "@/lib/core/config"
import { ActionState } from "@/lib/actions"
import { z } from "zod"

const bugSchema = z.object({
  title: z.string().min(5, "Title is too short"),
  description: z.string().min(10, "Please provide more detail"),
  steps: z.string().min(10, "Please outline the steps to reproduce"),
  expected: z.string().min(5, "Please describe the expected behavior"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
})

export async function submitBugReportAction(
  _prevState: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = bugSchema.safeParse(rawData)

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { title, description, steps, expected, email } = validated.data
    const screenshot = formData.get("screenshot") as File | null

    let screenshotUrl = ""
    if (screenshot && screenshot.size > 0) {
      const blob = await put(`bugs/${Date.now()}-${screenshot.name}`, screenshot, {
        access: "public",
      })
      screenshotUrl = blob.url
    }

    // Prepare GitHub Issue Body
    const body = `
### Description
${description}

### Steps to Reproduce
${steps}

### Expected Behavior
${expected}

---
**Reporter Email**: ${email || "Anonymous"}
${screenshotUrl ? `**Screenshot**: ![](${screenshotUrl})` : ""}
    `.trim()

    if (!config.github.token) {
      console.error("GITHUB_TOKEN is not configured")
      return { success: false, error: "GitHub integration is not configured. Please contact the administrator." }
    }

    const [owner, repo] = config.github.repo.split("/")
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `token ${config.github.token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `[BUG] ${title}`,
        body: body,
      }),
    })

    if (!response.ok) {
      const errData = await response.json()
      console.error("GitHub API error:", errData)
      return { success: false, error: "Failed to create GitHub issue. Please try again later." }
    }

    const issue = await response.json()
    return { success: true, data: { url: issue.html_url } }

  } catch (error) {
    console.error("Bug report failed:", error)
    return { success: false, error: "Internal server error. Failed to submit bug report." }
  }
}

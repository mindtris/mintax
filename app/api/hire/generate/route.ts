import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSettings, getLLMSettings } from "@/lib/services/settings"
import { getLlmPromptById, getLlmPromptsByModule } from "@/lib/services/llm-prompts"
import { requestLLM } from "@/lib/ai/providers/llmProvider"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const settings = await getSettings(org.id)
    const llmSettings = getLLMSettings(settings)

    const { prompt, promptId } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Get DB prompt — by ID if specified, otherwise first enabled hire prompt
    let systemPrompt = ""
    if (promptId) {
      const dbPrompt = await getLlmPromptById(promptId, org.id)
      if (dbPrompt?.prompt) systemPrompt = dbPrompt.prompt
    }
    if (!systemPrompt) {
      const modulePrompts = await getLlmPromptsByModule(org.id, "hire")
      if (modulePrompts[0]?.prompt) systemPrompt = modulePrompts[0].prompt
    }

    const fullPrompt = `${systemPrompt || "You are an HR specialist. Generate a professional job posting."}

Generate a job posting based on the following brief. Return a JSON object with two fields:
- "description": the full job description with responsibilities
- "requirements": the qualifications and skills needed

Brief: ${prompt}`

    const result = await requestLLM(llmSettings, {
      prompt: fullPrompt,
      schema: {
        description: "the job description text",
        requirements: "the requirements text",
      },
      purpose: "hire",
    })

    return NextResponse.json({
      description: result.output?.description || "",
      requirements: result.output?.requirements || "",
    })
  } catch (err: any) {
    console.error("AI generation error:", err)
    return NextResponse.json(
      { error: err.message || "Generation failed. Check LLM settings." },
      { status: 500 }
    )
  }
}

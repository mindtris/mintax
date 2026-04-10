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

    const { prompt, contentType, platform, tone, maxLength, promptId } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Get DB prompt — by ID if specified, otherwise first enabled engage prompt
    let systemPrompt = ""
    if (promptId) {
      const dbPrompt = await getLlmPromptById(promptId, org.id)
      if (dbPrompt?.prompt) systemPrompt = dbPrompt.prompt
    }
    if (!systemPrompt) {
      const modulePrompts = await getLlmPromptsByModule(org.id, "engage")
      if (modulePrompts[0]?.prompt) systemPrompt = modulePrompts[0].prompt
    }

    const fullPrompt = buildPrompt(systemPrompt, prompt, contentType, platform, tone, maxLength)

    const result = await requestLLM(llmSettings, {
      prompt: fullPrompt,
      schema: {
        content: "the generated post/article content",
      },
      purpose: "generate",
    })

    const generatedContent = result.output?.content || ""

    return NextResponse.json({ content: generatedContent })
  } catch (err: any) {
    console.error("AI generation error:", err)
    return NextResponse.json(
      { error: err.message || "Generation failed. Check LLM settings." },
      { status: 500 }
    )
  }
}

function buildPrompt(
  systemPrompt: string,
  userPrompt: string,
  contentType: string = "post",
  platform: string = "",
  tone: string = "professional",
  maxLength: number = 280
): string {
  const platformHints: Record<string, string> = {
    twitter: "Platform: Twitter/X. Keep under 280 characters. Punchy and concise.",
    linkedin: "Platform: LinkedIn. Professional tone. Up to 3000 chars. Use line breaks.",
    facebook: "Platform: Facebook. Conversational and engaging. Ask questions.",
    instagram: "Platform: Instagram. Visual-first. Use relevant hashtags.",
    medium: "Platform: Medium. Long-form article. Use markdown.",
    devto: "Platform: Dev.to. Developer-focused. Technical but accessible.",
    wordpress: "Platform: WordPress. SEO-friendly. Use headers.",
  }

  const contentTypeHints: Record<string, string> = {
    post: "Write a social media post",
    article: "Write a blog article with title, intro, body, and conclusion",
    thread: "Write a thread of 3-5 connected posts separated by ---",
    newsletter: "Write a newsletter with subject, greeting, body, and sign-off",
  }

  // If we have a DB system prompt, use it as the base
  if (systemPrompt) {
    return `${systemPrompt}

${contentTypeHints[contentType] || "Write a social media post"} about the following topic.
${platform && platformHints[platform] ? platformHints[platform] : ""}
Tone: ${tone}. ${maxLength > 0 ? `Target: under ${maxLength} characters.` : ""}
Return ONLY the content, no meta-text.

Topic: ${userPrompt}`
  }

  // Fallback to basic prompt
  return `You are a content writing expert. ${contentTypeHints[contentType] || "Write a social media post"} about the following topic.
${platform && platformHints[platform] ? platformHints[platform] : ""}
Tone: ${tone}. ${maxLength > 0 ? `Target: under ${maxLength} characters.` : ""}
Return ONLY the content, no meta-text.

Topic: ${userPrompt}`
}

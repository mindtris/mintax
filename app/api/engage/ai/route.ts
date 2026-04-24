import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getActiveOrg } from "@/lib/core/auth"

const SYSTEM_PROMPTS = {
  title: (content: string) => `You are an Elite Content Strategist. Based on the article below, generate 3 high-CTR titles.
Strategies:
1. "Benefit-First" (e.g., How to [Result] without [Pain])
2. "The Big Number" (e.g., 7 Ways to [Result])
3. "The Curiosity Gap" (e.g., Why 99% of [X] fail at [Y])

Return ONLY a JSON array of 3 strings.

Draft:
${content.slice(0, 3000)}`,

  seo: (content: string, title: string) => `You are a Senior SEO Strategist. Based on the article below, generate high-conversion SEO metadata.
1. Meta Title (Max 60 chars): Use a "Result-Oriented" or "Utility-First" formula.
2. Meta Description (Max 160 chars): Start with the primary answer to the article's core question to target "Featured Snippets".

Return ONLY valid JSON: {"seoTitle": "...", "seoDescription": "..."}

Title: ${title}
Content:
${content.slice(0, 3000)}`,

  excerpt: (content: string) => `You are an Expert Copywriter. Write a 2-sentence "Curiosity-Gap" excerpt for this article.
Goal: Must make the reader feel they are missing critical information if they don't click "Read More".
Tone: Direct, punchy, and result-oriented.

Return ONLY plain text.

Content:
${content.slice(0, 2000)}`,

  slug: (title: string) => `Convert the following blog post title into a URL-friendly slug. Use lowercase, hyphens only, no special characters. Return ONLY the slug string.

Title: ${title}`,

  generate: (topic: string) => `You are a Senior Software Engineer and Expert Content Strategist. Your task is to write a comprehensive, technically-authoritative article about:
"${topic}"

Elite Writing Standards:
1. VOICE: Sound like a senior expert at a conference afterparty. Be technically precise, opinionated, and slightly irreverent. NO AI fluff (Unlock, Leverage, Empower, Seamless).
2. SNIPPET TARGETING: The first 40-50 words of every major section must directly answer the section's core question to dominate "Featured Snippets".
3. STRUCTURE: Lead with the Conclusion or the Problem. One idea per paragraph for high whitespace.
4. SEMANTIC AUTH: Include a "Critical Definitions" or "FAQ" section at the bottom for topical authority.

OUTPUT FORMAT (STRICT JSON):
{
  "title": "A power-driven, utility-first SEO title",
  "seoTitle": "Meta title (max 60 chars)",
  "seoDescription": "Meta description (max 160 chars)",
  "excerpt": "A punchy 2-sentence value proposition",
  "content": "The full article in clean HTML (<h2>, <p>, <ul>, <li>, <strong>). No markdown backticks."
}
Output valid JSON only.`,

  generate_social: (topic: string, type: string) => {
    const persona = "You are a Senior Growth Strategist and Expert Copywriter specializing in high-conversion social content.";
    
    if (type === "thread") {
      return `${persona} Your task is to write a high-authority X (Twitter) THREAD based on the topic: "${topic}".
1. THE HOOK: The first tweet must be a massive "Outcome Hook" or "Negative Hook".
2. STRUCTURE: Return a thread of 5-8 tweets. 
3. FORMATTING: Separate each tweet with "[TWEET]".
4. Return ONLY a JSON object: {"content": "Tweet 1 content... [TWEET] Tweet 2 content... [TWEET] ...", "isThread": true}`;
    }

    if (type === "poll") {
      return `${persona} Your task is to write an engaging Poll for X and LinkedIn based on the topic: "${topic}".
1. THE QUESTION: Write a provocative, debate-starting question.
2. THE OPTIONS: Provide 3-4 distinct options (max 25 chars each).
3. Return ONLY a JSON object: {"content": "Question text...", "pollOptions": ["Option 1", "Option 2", "Option 3"], "isPoll": true}`;
    }

    return `${persona} Your task is to write a premium social media post based on the following topic:
"${topic}"

Platforms: X (Twitter) and LinkedIn.

Strategic Guidelines:
1. THE HOOK: Start with a "Scroll-Stopping Hook" in the first line. 
2. PLATFORM RULES:
   - LinkedIn: Optimal length 1200-1500 chars. Use high whitespace.
   - X (Twitter): Ultra-concise (under 280 chars).
3. TONE & STYLE: Opinionated, technically precise, and direct. NO AI padding.

Return ONLY a JSON object:
{
  "content": "The generated social post content (Platform-optimized, starting with the hook)..."
}
Output valid JSON only.`;
  },
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const { task, content = "", title = "", contentType = "post" } = await req.json()

    if (!["title", "seo", "excerpt", "slug", "generate", "generate_social"].includes(task)) {
      return NextResponse.json({ error: "Invalid task" }, { status: 400 })
    }

    let prompt = ""
    if (task === "title") prompt = SYSTEM_PROMPTS.title(content)
    if (task === "seo")   prompt = SYSTEM_PROMPTS.seo(content, title)
    if (task === "excerpt") prompt = SYSTEM_PROMPTS.excerpt(content)
    if (task === "slug") prompt = SYSTEM_PROMPTS.slug(title)
    if (task === "generate") prompt = SYSTEM_PROMPTS.generate(title)
    if (task === "generate_social") prompt = SYSTEM_PROMPTS.generate_social(title, contentType)

    // Use the LLM from existing langchain setup
    const { ChatOpenAI } = await import("@langchain/openai")
    const { HumanMessage } = await import("@langchain/core/messages")

    const llm = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    const response = await llm.invoke([new HumanMessage(prompt)])
    const text = (response.content as string).trim()

    // Parse response based on task
    if (task === "title") {
      try {
        const titles = JSON.parse(text)
        return NextResponse.json({ titles })
      } catch {
        // Try to extract titles from text if not valid JSON
        const lines = text.split("\n").filter((l: string) => l.trim()).slice(0, 3)
        return NextResponse.json({ titles: lines })
      }
    }

    if (task === "seo") {
      try {
        const seo = JSON.parse(text)
        return NextResponse.json(seo)
      } catch {
        return NextResponse.json({ error: "Failed to parse SEO response" }, { status: 500 })
      }
    }

    if (task === "excerpt") {
      return NextResponse.json({ excerpt: text })
    }

    if (task === "slug") {
      const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      return NextResponse.json({ slug })
    }

    if (task === "generate" || task === "generate_social") {
      let cleanJson = text.trim()
      if (cleanJson.startsWith("```json")) cleanJson = cleanJson.replace(/^```json\s*\n?/, "")
      if (cleanJson.startsWith("```")) cleanJson = cleanJson.replace(/^```\s*\n?/, "")
      cleanJson = cleanJson.replace(/\n?```$/, "").trim()
      
      const parsed = JSON.parse(cleanJson)
      return NextResponse.json(parsed)
    }

  } catch (err: any) {
    console.error("[engage/ai]", err)
    return NextResponse.json({ error: err.message || "AI request failed" }, { status: 500 })
  }
}

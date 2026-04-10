import { prisma } from "@/lib/core/db"
import { DEFAULT_PROMPT_ANALYSE_NEW_FILE } from "./defaults"

export const LLM_MODULES = [
  { value: "unsorted", label: "Unsorted (file analysis)" },
  { value: "engage", label: "Engage (content & social)" },
  { value: "hire", label: "Hire (job posts & screening)" },
  { value: "sales", label: "Sales (invoices & estimates)" },
] as const

export type LlmModule = (typeof LLM_MODULES)[number]["value"]

export async function getLlmPrompts(orgId: string) {
  return await prisma.llmPrompt.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
  })
}

export async function getLlmPromptsByModule(orgId: string, module: string) {
  return await prisma.llmPrompt.findMany({
    where: { organizationId: orgId, module, enabled: true },
    orderBy: { createdAt: "asc" },
  })
}

export async function getLlmPromptById(id: string, orgId: string) {
  return await prisma.llmPrompt.findFirst({
    where: { id, organizationId: orgId },
  })
}

export async function createLlmPrompt(orgId: string, data: {
  name: string
  module: string
  prompt: string
  provider?: string
  model?: string
  enabled?: boolean
}) {
  return await prisma.llmPrompt.create({
    data: {
      organizationId: orgId,
      name: data.name,
      module: data.module,
      prompt: data.prompt,
      provider: data.provider || null,
      model: data.model || null,
      enabled: data.enabled ?? true,
    },
  })
}

export async function updateLlmPrompt(id: string, orgId: string, data: {
  name?: string
  module?: string
  prompt?: string
  provider?: string
  model?: string
  enabled?: boolean
}) {
  return await prisma.llmPrompt.update({
    where: { id, organizationId: orgId },
    data: {
      name: data.name,
      module: data.module,
      prompt: data.prompt,
      provider: data.provider,
      model: data.model,
      enabled: data.enabled,
    },
  })
}

export async function deleteLlmPrompt(id: string, orgId: string) {
  return await prisma.llmPrompt.delete({
    where: { id, organizationId: orgId },
  })
}

const DEFAULT_PROMPTS: { name: string; module: string; prompt: string }[] = [
  {
    name: "Transaction analysis",
    module: "unsorted",
    prompt: DEFAULT_PROMPT_ANALYSE_NEW_FILE,
  },
  {
    name: "Social post writer",
    module: "engage",
    prompt: `You are an SEO-savvy social media strategist who writes like a real person, not a bot.

Generate social media content that reads naturally — the way someone would actually talk about this topic to a friend or colleague. Prioritize discoverability without sacrificing authenticity.

SEO & DISCOVERABILITY:
- Weave in high-intent keywords naturally within the first two lines
- Use hashtags sparingly (2-4) — only ones people actually search for, never generic spam like #business or #success
- Front-load the hook: the first line must stop the scroll
- Write for the algorithm AND the human — engagement signals (saves, shares) matter more than impressions

TONE & VOICE:
- Conversational, not corporate. No buzzwords, no filler, no "excited to announce"
- Write with a point of view — opinions outperform safe takes
- Short sentences. Line breaks between ideas. White space is your friend
- Match platform norms: LinkedIn = storytelling with insight, Twitter/X = sharp and punchy, Instagram = visual-first with personality

STRUCTURE:
- Hook (1 line that earns the read)
- Value (the actual insight, story, or takeaway)
- CTA (only when it feels natural — not every post needs "link in bio")
- Keep within platform character limits

NEVER:
- Fabricate statistics, quotes, or attribution
- Use emojis as bullet points or decoration
- Sound like AI-generated marketing copy
- Start with "In today's world" or any variation of it`,
  },
  {
    name: "Job post generator",
    module: "hire",
    prompt: `You are an HR specialist and copywriter. Generate compelling job postings based on the given role details.

RULES:
- Write an engaging opening that sells the opportunity
- List 5-8 key responsibilities
- List must-have vs nice-to-have qualifications separately
- Include salary range if provided
- Mention benefits and culture highlights
- Use inclusive language throughout
- Keep the tone professional but approachable`,
  },
  {
    name: "Invoice assistant",
    module: "sales",
    prompt: `You are a billing and invoicing assistant. Help generate professional invoice descriptions, payment terms, and follow-up messages.

RULES:
- Use clear, professional language
- Include relevant line item descriptions
- Calculate totals accurately
- Suggest appropriate payment terms based on client history
- Generate polite but firm follow-up messages for overdue invoices`,
  },
]

export async function ensureDefaultPrompts(orgId: string) {
  const existing = await prisma.llmPrompt.findMany({
    where: { organizationId: orgId },
    select: { module: true },
  })
  const existingModules = new Set(existing.map((p) => p.module))

  for (const prompt of DEFAULT_PROMPTS) {
    if (!existingModules.has(prompt.module)) {
      await createLlmPrompt(orgId, prompt)
    }
  }
}

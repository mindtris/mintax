import { prisma } from "@/lib/core/db"
import { encrypt, decrypt, SENSITIVE_SETTINGS } from "@/lib/core/encryption"
import { PROVIDERS } from "@/lib/integrations/llm-providers"
import { cache } from "react"
import { LLMProvider } from "@/lib/ai/providers/llmProvider"

export type SettingsMap = Record<string, string>

/**
 * Helper to extract LLM provider settings from SettingsMap.
 * Values are already decrypted at this point.
 */
export function getLLMSettings(settings: SettingsMap) {
  const priorities = (settings.llm_providers || "openai,google,mistral,openai_compatible").split(",").map(p => p.trim()).filter(Boolean)

  const providers = priorities.map((provider) => {
    if (provider === "openai") {
      return {
        provider: provider as LLMProvider,
        apiKey: settings.openai_api_key || "",
        model: settings.openai_model_name || PROVIDERS[0]['defaultModelName'],
      }
    }
    if (provider === "google") {
      return {
        provider: provider as LLMProvider,
        apiKey: settings.google_api_key || "",
        model: settings.google_model_name || PROVIDERS[1]['defaultModelName'],
      }
    }
    if (provider === "mistral") {
      return {
        provider: provider as LLMProvider,
        apiKey: settings.mistral_api_key || "",
        model: settings.mistral_model_name || PROVIDERS[2]['defaultModelName'],
      }
    }
    if (provider === "openai_compatible") {
      const providerMeta = PROVIDERS.find(p => p.key === "openai_compatible")
      return {
        provider: provider as LLMProvider,
        apiKey: settings.openai_compatible_api_key || "",
        model: settings.openai_compatible_model_name || "",
        baseUrl: settings.openai_compatible_base_url || providerMeta?.defaultBaseUrl || "",
      }
    }
    return null
  }).filter((provider): provider is NonNullable<typeof provider> => provider !== null)

  // Per-purpose model overrides from settings
  const purposeModels: Partial<Record<string, string>> = {}
  if (settings.llm_model_analyze) purposeModels.analyze = settings.llm_model_analyze
  if (settings.llm_model_generate) purposeModels.generate = settings.llm_model_generate
  if (settings.llm_model_hire) purposeModels.hire = settings.llm_model_hire

  return {
    providers,
    purposeModels,
  }
}

/**
 * Get all settings for an org. Sensitive values are decrypted transparently.
 */
export const getSettings = cache(async (orgId: string): Promise<SettingsMap> => {
  const settings = await prisma.setting.findMany({
    where: { organizationId: orgId },
  })

  return settings.reduce((acc, setting) => {
    const isSensitive = SENSITIVE_SETTINGS.includes(setting.code)
    acc[setting.code] = isSensitive ? decrypt(setting.value || "") : (setting.value || "")
    return acc
  }, {} as SettingsMap)
})

/**
 * Update a setting. Sensitive values are encrypted before storage.
 */
export async function updateSettings(orgId: string, code: string, value: string | undefined) {
  const isSensitive = SENSITIVE_SETTINGS.includes(code)
  const storedValue = isSensitive && value ? encrypt(value) : value

  return await prisma.setting.upsert({
    where: { organizationId_code: { code, organizationId: orgId } },
    update: { value: storedValue },
    create: {
      code,
      value: storedValue,
      name: code,
      organizationId: orgId,
    },
  })
}

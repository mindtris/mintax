"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ActionState } from "@/lib/actions"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import {
  PublicApiConfigView,
  getPublicApiConfigView,
  setPublicApiEnabled,
  upsertPublicApiConfig,
} from "@/lib/services/public-api-config"

const originSchema = z.string().url("Each origin must be a valid URL (https://example.com)")

const formSchema = z.object({
  enabled: z.enum(["true", "false"]).transform((v) => v === "true"),
  leadsEnabled: z.enum(["true", "false"]).transform((v) => v === "true"),
  allowedOrigins: z.string().default(""),
  ratePerMinute: z.coerce.number().int().min(1).max(1000).default(5),
  turnstileSecret: z.string().optional(),
  clearTurnstileSecret: z.enum(["true", "false"]).optional(),
  calcomEnabled: z.enum(["true", "false"]).transform((v) => v === "true"),
  contentEnabled: z.enum(["true", "false"]).transform((v) => v === "true"),
  contentCacheSeconds: z.coerce.number().int().min(0).max(86_400).default(60),
})

export async function getPublicApiConfigForCurrentOrg(): Promise<PublicApiConfigView | null> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  return getPublicApiConfigView(org.id)
}

export async function togglePublicApiEnabledAction(enabled: boolean): Promise<ActionState<{ enabled: boolean }>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  try {
    await setPublicApiEnabled(org.id, enabled)
    revalidatePath("/settings")
    return { success: true, data: { enabled } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update public API status",
    }
  }
}

export async function savePublicApiConfigAction(
  _prevState: ActionState<PublicApiConfigView> | null,
  formData: FormData
): Promise<ActionState<PublicApiConfigView>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const parsed = formSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid form data" }
  }

  const input = parsed.data
  const origins = input.allowedOrigins
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)

  for (const o of origins) {
    const v = originSchema.safeParse(o)
    if (!v.success) {
      return { success: false, error: `Invalid origin "${o}" — must be a full URL (https://example.com)` }
    }
  }

  const turnstileSecret =
    input.clearTurnstileSecret === "true"
      ? null
      : input.turnstileSecret && input.turnstileSecret.trim().length > 0
        ? input.turnstileSecret.trim()
        : undefined

  try {
    const saved = await upsertPublicApiConfig(org.id, {
      enabled: input.enabled,
      leadsEnabled: input.leadsEnabled,
      allowedOrigins: origins,
      ratePerMinute: input.ratePerMinute,
      turnstileSecret,
      calcomEnabled: input.calcomEnabled,
      contentEnabled: input.contentEnabled,
      contentCacheSeconds: input.contentCacheSeconds,
    })
    revalidatePath("/settings")
    return { success: true, data: saved }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save public API settings",
    }
  }
}

import { prisma } from "@/lib/core/db"
import { encrypt, decrypt, isEncrypted } from "@/lib/core/encryption"
import type { PublicApiConfig } from "@/lib/prisma/client"

export type PublicApiConfigView = Omit<PublicApiConfig, "turnstileSecret"> & {
  turnstileSecretPreview: string | null
  hasTurnstileSecret: boolean
}

export type PublicApiConfigInput = {
  enabled: boolean
  allowedOrigins: string[]
  ratePerMinute: number
  leadsEnabled: boolean
  turnstileSecret?: string | null
  calcomEnabled: boolean
  contentEnabled: boolean
  contentCacheSeconds: number
}

export async function getPublicApiConfig(organizationId: string): Promise<PublicApiConfig | null> {
  return prisma.publicApiConfig.findUnique({ where: { organizationId } })
}

export async function getPublicApiConfigBySlug(slug: string): Promise<{ orgId: string; config: PublicApiConfig } | null> {
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, publicApiConfig: true },
  })
  if (!org || !org.publicApiConfig) return null
  return { orgId: org.id, config: org.publicApiConfig }
}

export async function getPublicApiConfigView(organizationId: string): Promise<PublicApiConfigView | null> {
  const cfg = await getPublicApiConfig(organizationId)
  if (!cfg) return null
  return toView(cfg)
}

export async function setPublicApiEnabled(organizationId: string, enabled: boolean): Promise<void> {
  await prisma.publicApiConfig.upsert({
    where: { organizationId },
    create: { organizationId, enabled },
    update: { enabled },
  })
}

export async function upsertPublicApiConfig(
  organizationId: string,
  input: PublicApiConfigInput
): Promise<PublicApiConfigView> {
  const existing = await prisma.publicApiConfig.findUnique({ where: { organizationId } })

  const turnstileSecret = resolveSecretForWrite(input.turnstileSecret, existing?.turnstileSecret)

  const contentCacheSeconds = Math.max(0, Math.min(86_400, input.contentCacheSeconds))

  const saved = await prisma.publicApiConfig.upsert({
    where: { organizationId },
    create: {
      organizationId,
      enabled: input.enabled,
      allowedOrigins: normalizeOrigins(input.allowedOrigins),
      ratePerMinute: Math.max(1, Math.min(1000, input.ratePerMinute)),
      leadsEnabled: input.leadsEnabled,
      turnstileSecret,
      calcomEnabled: input.calcomEnabled,
      contentEnabled: input.contentEnabled,
      contentCacheSeconds,
    },
    update: {
      enabled: input.enabled,
      allowedOrigins: normalizeOrigins(input.allowedOrigins),
      ratePerMinute: Math.max(1, Math.min(1000, input.ratePerMinute)),
      leadsEnabled: input.leadsEnabled,
      turnstileSecret,
      calcomEnabled: input.calcomEnabled,
      contentEnabled: input.contentEnabled,
      contentCacheSeconds,
    },
  })

  return toView(saved)
}

export function decryptTurnstileSecret(config: Pick<PublicApiConfig, "turnstileSecret">): string | null {
  if (!config.turnstileSecret) return null
  return decrypt(config.turnstileSecret) || null
}

function resolveSecretForWrite(incoming: string | null | undefined, existing: string | null | undefined): string | null {
  if (incoming === null) return null
  if (incoming === undefined) return existing ?? null
  const trimmed = incoming.trim()
  if (!trimmed) return existing ?? null
  return isEncrypted(trimmed) ? trimmed : encrypt(trimmed)
}

function normalizeOrigins(origins: string[]): string[] {
  const set = new Set<string>()
  for (const raw of origins) {
    const o = raw.trim().replace(/\/+$/, "")
    if (!o) continue
    try {
      new URL(o)
      set.add(o)
    } catch {
      // skip malformed
    }
  }
  return Array.from(set)
}

function toView(cfg: PublicApiConfig): PublicApiConfigView {
  const tsDecrypted = cfg.turnstileSecret ? decrypt(cfg.turnstileSecret) : null
  const { turnstileSecret: _ts, ...rest } = cfg
  return {
    ...rest,
    turnstileSecretPreview: tsDecrypted ? maskSecret(tsDecrypted) : null,
    hasTurnstileSecret: Boolean(tsDecrypted),
  }
}

function maskSecret(value: string): string {
  if (value.length <= 8) return "•".repeat(value.length)
  return `${value.slice(0, 4)}${"•".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`
}

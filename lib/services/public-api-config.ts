import { prisma } from "@/lib/core/db"
import { encrypt, decrypt, isEncrypted } from "@/lib/core/encryption"
import type { PublicApiConfig } from "@/lib/prisma/client"

export type PublicApiConfigView = Omit<PublicApiConfig, "turnstileSecret" | "calcomWebhookSecret"> & {
  turnstileSecretPreview: string | null
  hasTurnstileSecret: boolean
  calcomWebhookSecretPreview: string | null
  hasCalcomWebhookSecret: boolean
}

export type PublicApiConfigInput = {
  enabled: boolean
  allowedOrigins: string[]
  ratePerMinute: number
  leadsEnabled: boolean
  turnstileSecret?: string | null
  calcomEnabled: boolean
  calcomWebhookSecret?: string | null
  calcomDefaultEventType?: string | null
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

export async function upsertPublicApiConfig(
  organizationId: string,
  input: PublicApiConfigInput
): Promise<PublicApiConfigView> {
  const existing = await prisma.publicApiConfig.findUnique({ where: { organizationId } })

  const turnstileSecret = resolveSecretForWrite(input.turnstileSecret, existing?.turnstileSecret)
  const calcomWebhookSecret = resolveSecretForWrite(input.calcomWebhookSecret, existing?.calcomWebhookSecret)
  const calcomDefaultEventType = normalizeEventType(input.calcomDefaultEventType)

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
      calcomWebhookSecret,
      calcomDefaultEventType,
    },
    update: {
      enabled: input.enabled,
      allowedOrigins: normalizeOrigins(input.allowedOrigins),
      ratePerMinute: Math.max(1, Math.min(1000, input.ratePerMinute)),
      leadsEnabled: input.leadsEnabled,
      turnstileSecret,
      calcomEnabled: input.calcomEnabled,
      calcomWebhookSecret,
      calcomDefaultEventType,
    },
  })

  return toView(saved)
}

export function decryptTurnstileSecret(config: Pick<PublicApiConfig, "turnstileSecret">): string | null {
  if (!config.turnstileSecret) return null
  return decrypt(config.turnstileSecret) || null
}

export function decryptCalcomWebhookSecret(config: Pick<PublicApiConfig, "calcomWebhookSecret">): string | null {
  if (!config.calcomWebhookSecret) return null
  return decrypt(config.calcomWebhookSecret) || null
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

function normalizeEventType(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toView(cfg: PublicApiConfig): PublicApiConfigView {
  const tsDecrypted = cfg.turnstileSecret ? decrypt(cfg.turnstileSecret) : null
  const calDecrypted = cfg.calcomWebhookSecret ? decrypt(cfg.calcomWebhookSecret) : null
  const { turnstileSecret: _ts, calcomWebhookSecret: _cs, ...rest } = cfg
  return {
    ...rest,
    turnstileSecretPreview: tsDecrypted ? maskSecret(tsDecrypted) : null,
    hasTurnstileSecret: Boolean(tsDecrypted),
    calcomWebhookSecretPreview: calDecrypted ? maskSecret(calDecrypted) : null,
    hasCalcomWebhookSecret: Boolean(calDecrypted),
  }
}

function maskSecret(value: string): string {
  if (value.length <= 8) return "•".repeat(value.length)
  return `${value.slice(0, 4)}${"•".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`
}

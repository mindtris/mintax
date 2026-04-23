import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/core/db"
import { apiError, apiOk } from "@/lib/core/api-response"
import { checkRateLimit } from "@/lib/core/rate-limit"
import { verifyTurnstile } from "@/lib/integrations/turnstile"
import { decryptTurnstileSecret, getPublicApiConfigBySlug } from "@/lib/services/public-api-config"

const sourceEnum = z.enum(["demo", "contact-sales", "newsletter", "press", "careers"])

const baseFields = {
  orgSlug: z.string().min(1, "orgSlug is required"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  phone: z.string().optional(),
  country: z.string().length(2).optional(),
  companySize: z.string().optional(),
  message: z.string().max(2000).optional(),
  preferredTime: z.string().optional(),
  turnstileToken: z.string().optional(),
}

const demoSchema = z.object({ source: z.literal("demo"), ...baseFields, name: z.string().min(1), company: z.string().min(1) })
const contactSchema = z.object({ source: z.literal("contact-sales"), ...baseFields, name: z.string().min(1), company: z.string().min(1) })
const newsletterSchema = z.object({ source: z.literal("newsletter"), ...baseFields })
const pressSchema = z.object({ source: z.literal("press"), ...baseFields, name: z.string().min(1) })
const careersSchema = z.object({ source: z.literal("careers"), ...baseFields, name: z.string().min(1) })

const bodySchema = z.discriminatedUnion("source", [demoSchema, contactSchema, newsletterSchema, pressSchema, careersSchema])

type LeadBody = z.infer<typeof bodySchema>

function corsHeadersFor(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  }
}

function ipFrom(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim()
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin")
  const orgSlug = req.nextUrl.searchParams.get("org")
  if (!origin || !orgSlug) {
    return new NextResponse(null, { status: 204 })
  }
  const lookup = await getPublicApiConfigBySlug(orgSlug)
  if (!lookup || !lookup.config.enabled || !lookup.config.allowedOrigins.includes(origin)) {
    return new NextResponse(null, { status: 204 })
  }
  return new NextResponse(null, { status: 204, headers: corsHeadersFor(origin) })
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin")

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return apiError("validation_error", "Malformed JSON body", 422)
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return apiError(
      "validation_error",
      "Invalid request body",
      422,
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    )
  }
  const body: LeadBody = parsed.data

  const lookup = await getPublicApiConfigBySlug(body.orgSlug)
  if (!lookup || !lookup.config.enabled || !lookup.config.leadsEnabled) {
    return apiError("not_found", "Organization not found or public API disabled", 404)
  }
  const { orgId, config } = lookup

  if (!origin || !config.allowedOrigins.includes(origin)) {
    return apiError("cors_denied", "Origin not allowed", 403)
  }
  const headers = corsHeadersFor(origin)

  const rl = checkRateLimit(`leads:${body.orgSlug}:${ipFrom(req)}`, config.ratePerMinute)
  if (!rl.ok) {
    return apiError("rate_limited", "Too many requests. Please try again shortly.", 429, undefined, {
      ...headers,
      "Retry-After": String(rl.retryAfterSeconds),
    })
  }

  const turnstileSecret = decryptTurnstileSecret(config)
  const turnstile = await verifyTurnstile(turnstileSecret, body.turnstileToken ?? null, ipFrom(req) || undefined)
  if (!turnstile.ok) {
    return apiError("turnstile_failed", "Captcha verification failed", 403, { reason: turnstile.reason }, headers)
  }

  const title = buildLeadTitle(body)
  const contactName = body.name ?? body.email

  const lead = await prisma.lead.create({
    data: {
      organizationId: orgId,
      title,
      contactName,
      email: body.email,
      phone: body.phone,
      company: body.company,
      source: body.source,
      stage: "new",
      probability: 10,
      description: buildDescription(body),
    },
    select: { id: true },
  })

  return apiOk({ id: lead.id }, 200, headers)
}

function buildLeadTitle(body: LeadBody): string {
  const who = body.company ?? body.name ?? body.email
  switch (body.source) {
    case "demo":
      return `Demo request: ${who}`
    case "contact-sales":
      return `Contact sales: ${who}`
    case "newsletter":
      return `Newsletter signup: ${body.email}`
    case "press":
      return `Press inquiry: ${who}`
    case "careers":
      return `Careers inquiry: ${who}`
  }
}

function buildDescription(body: LeadBody): string | undefined {
  const parts: string[] = []
  if (body.message) parts.push(body.message)
  if (body.country) parts.push(`Country: ${body.country}`)
  if (body.companySize) parts.push(`Company size: ${body.companySize}`)
  if (body.preferredTime) parts.push(`Preferred time: ${body.preferredTime}`)
  return parts.length > 0 ? parts.join("\n") : undefined
}

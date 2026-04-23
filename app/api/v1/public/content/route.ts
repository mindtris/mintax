import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/core/db"
import { apiError, apiOk } from "@/lib/core/api-response"
import { checkRateLimit } from "@/lib/core/rate-limit"
import { getPublicApiConfigBySlug } from "@/lib/services/public-api-config"

const CONTENT_TYPES = ["blog", "doc", "help", "changelog"] as const

const querySchema = z.object({
  org: z.string().min(1),
  type: z.enum(CONTENT_TYPES),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

function corsHeadersFor(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin")

  const parsed = querySchema.safeParse({
    org: req.nextUrl.searchParams.get("org"),
    type: req.nextUrl.searchParams.get("type"),
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    offset: req.nextUrl.searchParams.get("offset") ?? undefined,
  })
  if (!parsed.success) {
    return apiError(
      "validation_error",
      "Invalid query parameters",
      422,
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    )
  }
  const { org, type, limit, offset } = parsed.data

  const lookup = await getPublicApiConfigBySlug(org)
  if (!lookup || !lookup.config.enabled || !lookup.config.contentEnabled) {
    return apiError("not_found", "Organization not found or content API disabled", 404)
  }
  const { orgId, config } = lookup

  if (origin && !config.allowedOrigins.includes(origin)) {
    return apiError("cors_denied", "Origin not allowed", 403)
  }
  const headers: Record<string, string> = origin ? corsHeadersFor(origin) : {}
  headers["Cache-Control"] = `public, s-maxage=${config.contentCacheSeconds}, stale-while-revalidate=600`

  const rl = checkRateLimit(`content:${org}:${ipFrom(req)}`, config.ratePerMinute)
  if (!rl.ok) {
    return apiError("rate_limited", "Too many requests. Please try again shortly.", 429, undefined, {
      ...headers,
      "Retry-After": String(rl.retryAfterSeconds),
    })
  }

  const where = {
    organizationId: orgId,
    contentType: type,
    visibility: "public",
    status: "published",
  }

  const [items, total] = await Promise.all([
    prisma.socialPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        tags: true,
        contentType: true,
        canonicalPath: true,
        heroImageId: true,
        seoTitle: true,
        seoDescription: true,
        publishedAt: true,
      },
    }),
    prisma.socialPost.count({ where }),
  ])

  return apiOk({ items, total, hasMore: offset + items.length < total }, 200, headers)
}

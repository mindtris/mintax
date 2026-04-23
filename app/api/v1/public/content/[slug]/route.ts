import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/core/db"
import { apiError, apiOk } from "@/lib/core/api-response"
import { checkRateLimit } from "@/lib/core/rate-limit"
import { getPublicApiConfigBySlug } from "@/lib/services/public-api-config"

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const origin = req.headers.get("origin")
  const orgSlug = req.nextUrl.searchParams.get("org")

  if (!orgSlug) {
    return apiError("validation_error", "Missing org parameter", 422)
  }
  if (!slug) {
    return apiError("validation_error", "Missing slug", 422)
  }

  const lookup = await getPublicApiConfigBySlug(orgSlug)
  if (!lookup || !lookup.config.enabled || !lookup.config.contentEnabled) {
    return apiError("not_found", "Organization not found or content API disabled", 404)
  }
  const { orgId, config } = lookup

  if (origin && !config.allowedOrigins.includes(origin)) {
    return apiError("cors_denied", "Origin not allowed", 403)
  }
  const headers: Record<string, string> = origin ? corsHeadersFor(origin) : {}
  headers["Cache-Control"] = `public, s-maxage=${config.contentCacheSeconds}, stale-while-revalidate=600`

  const rl = checkRateLimit(`content-single:${orgSlug}:${ipFrom(req)}`, config.ratePerMinute)
  if (!rl.ok) {
    return apiError("rate_limited", "Too many requests. Please try again shortly.", 429, undefined, {
      ...headers,
      "Retry-After": String(rl.retryAfterSeconds),
    })
  }

  const item = await prisma.socialPost.findFirst({
    where: {
      organizationId: orgId,
      slug,
      visibility: "public",
      status: "published",
    },
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
  })

  if (!item) {
    return apiError("not_found", "Content not found", 404, undefined, headers)
  }

  return apiOk({ item }, 200, headers)
}

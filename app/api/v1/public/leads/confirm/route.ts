import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/core/db"
import { apiError, apiOk } from "@/lib/core/api-response"
import { checkRateLimit } from "@/lib/core/rate-limit"

const bodySchema = z.object({
  token: z.string().min(16, "Invalid token"),
})

function ipFrom(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim()
}

export async function POST(req: NextRequest) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return apiError("validation_error", "Malformed JSON body", 422)
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return apiError("validation_error", "Invalid request body", 422)
  }
  const { token } = parsed.data

  const rl = checkRateLimit(`leads-confirm:${ipFrom(req)}`, 10)
  if (!rl.ok) {
    return apiError("rate_limited", "Too many requests. Please try again shortly.", 429, undefined, {
      "Retry-After": String(rl.retryAfterSeconds),
    })
  }

  const lead = await prisma.lead.findUnique({
    where: { confirmationToken: token },
    select: {
      id: true,
      confirmedAt: true,
      confirmationTokenExpiresAt: true,
    },
  })

  if (!lead) {
    return apiError("not_found", "Invalid or already used confirmation link", 404)
  }

  if (lead.confirmedAt) {
    return apiOk({ id: lead.id, alreadyConfirmed: true })
  }

  const now = new Date()
  if (!lead.confirmationTokenExpiresAt || lead.confirmationTokenExpiresAt < now) {
    return apiError("expired", "Confirmation link has expired", 410)
  }

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      confirmedAt: now,
      confirmationToken: null,
      confirmationTokenExpiresAt: null,
    },
    select: { id: true },
  })

  return apiOk({ id: updated.id, alreadyConfirmed: false })
}

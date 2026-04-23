import crypto from "crypto"
import { NextRequest } from "next/server"
import { apiError, apiOk } from "@/lib/core/api-response"
import { getPublicApiConfigBySlug } from "@/lib/services/public-api-config"
import {
  handleCalcomBookingCancelled,
  handleCalcomBookingCreated,
  handleCalcomBookingRescheduled,
  type CalcomEvent,
} from "@/lib/services/meetings"

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
  } catch {
    return false
  }
}

function verifyCalcomSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  return timingSafeEqualHex(computed, header.trim().toLowerCase())
}

export async function POST(req: NextRequest) {
  const orgSlug = req.nextUrl.searchParams.get("org")
  if (!orgSlug) {
    return apiError("not_found", "Missing org parameter", 404)
  }

  const lookup = await getPublicApiConfigBySlug(orgSlug)
  if (!lookup || !lookup.config.enabled || !lookup.config.calcomEnabled) {
    return apiError("not_found", "Organization not found or cal.com webhook disabled", 404)
  }
  const { orgId } = lookup

  const secret = process.env.CALCOM_WEBHOOK_SECRET
  if (!secret) {
    return apiError("internal_error", "CALCOM_WEBHOOK_SECRET not configured", 500)
  }

  const rawBody = await req.text()
  const signatureHeader =
    req.headers.get("x-cal-signature-256") ?? req.headers.get("X-Cal-Signature-256")

  if (!verifyCalcomSignature(rawBody, signatureHeader, secret)) {
    return apiError("unauthorized", "Invalid signature", 401)
  }

  let event: CalcomEvent
  try {
    event = JSON.parse(rawBody) as CalcomEvent
  } catch {
    return apiError("validation_error", "Malformed JSON body", 422)
  }

  const trigger = event.triggerEvent

  try {
    switch (trigger) {
      case "BOOKING_CREATED": {
        const result = await handleCalcomBookingCreated(orgId, event)
        return apiOk({ event: trigger, result })
      }
      case "BOOKING_RESCHEDULED": {
        const result = await handleCalcomBookingRescheduled(orgId, event)
        return apiOk({ event: trigger, result })
      }
      case "BOOKING_CANCELLED": {
        const result = await handleCalcomBookingCancelled(orgId, event)
        return apiOk({ event: trigger, result })
      }
      default:
        return apiOk({ event: trigger ?? null, result: { status: "skipped", reason: "unhandled_trigger" } })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process webhook"
    return apiError("internal_error", message, 500)
  }
}

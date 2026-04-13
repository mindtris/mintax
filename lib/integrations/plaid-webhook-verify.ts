import crypto from "crypto"
import { importJWK, jwtVerify, decodeProtectedHeader, type JWK } from "jose"
import { getPlaidClient } from "@/lib/integrations/plaid"

/**
 * Plaid webhook verification.
 *
 * Plaid signs every webhook with an ES256 JWT in the `plaid-verification` header.
 * The JWT body contains `request_body_sha256` — we verify:
 *   1. JWT signature is valid (using the public key fetched via /webhook_verification_key/get)
 *   2. JWT `iat` is within 5 minutes (replay protection)
 *   3. SHA256 of the raw request body matches `request_body_sha256`
 *
 * Keys are cached by `kid` indefinitely (Plaid rotates by issuing a new kid).
 * https://plaid.com/docs/api/webhooks/webhook-verification/
 */

type PlaidWebhookKey = {
  alg: string
  crv: string
  kid: string
  kty: string
  use: string
  x: string
  y: string
  expired_at: string | null
}

const keyCache = new Map<string, PlaidWebhookKey>()

async function getVerificationKey(kid: string): Promise<PlaidWebhookKey | null> {
  const cached = keyCache.get(kid)
  if (cached && !cached.expired_at) return cached

  try {
    const client = getPlaidClient()
    const res = await client.webhookVerificationKeyGet({ key_id: kid })
    const key = res.data.key as unknown as PlaidWebhookKey
    if (!key) return null
    keyCache.set(kid, key)
    return key
  } catch (err) {
    console.error("plaid webhook: failed to fetch verification key", err)
    return null
  }
}

/**
 * Verifies a Plaid webhook. Returns true iff the request is authentic.
 * `rawBody` must be the exact bytes of the request body (no JSON re-serialization).
 */
export async function verifyPlaidWebhook(
  rawBody: string,
  verificationHeader: string | null
): Promise<boolean> {
  if (!verificationHeader) return false

  let kid: string
  try {
    const header = decodeProtectedHeader(verificationHeader)
    if (header.alg !== "ES256" || !header.kid) return false
    kid = header.kid
  } catch {
    return false
  }

  const key = await getVerificationKey(kid)
  if (!key) return false
  if (key.expired_at) return false // key has been retired

  let payload: { request_body_sha256?: string; iat?: number }
  try {
    const jwk: JWK = {
      kty: key.kty,
      crv: key.crv,
      x: key.x,
      y: key.y,
      alg: key.alg,
      use: key.use,
    }
    const publicKey = await importJWK(jwk, "ES256")
    const result = await jwtVerify(verificationHeader, publicKey, {
      algorithms: ["ES256"],
      // jose enforces iat/exp if present; Plaid JWTs only include iat, so we check freshness manually.
    })
    payload = result.payload as any
  } catch (err) {
    console.error("plaid webhook: JWT signature verification failed", err)
    return false
  }

  // Replay protection: iat within 5 minutes
  if (!payload.iat) return false
  const ageSeconds = Math.floor(Date.now() / 1000) - payload.iat
  if (ageSeconds > 5 * 60 || ageSeconds < -30) return false

  // Body integrity: sha256(rawBody) must match request_body_sha256
  if (!payload.request_body_sha256) return false
  const computed = crypto.createHash("sha256").update(rawBody).digest("hex")
  if (!timingSafeEqualHex(computed, payload.request_body_sha256)) return false

  return true
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
  } catch {
    return false
  }
}

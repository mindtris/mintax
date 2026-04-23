type Bucket = { count: number; resetAt: number }

const BUCKETS = new Map<string, Bucket>()
const WINDOW_MS = 60_000

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSeconds: number; resetAt: number }

export function checkRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now()
  const bucket = BUCKETS.get(key)

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + WINDOW_MS
    BUCKETS.set(key, { count: 1, resetAt })
    pruneIfNeeded(now)
    return { ok: true, remaining: limit - 1, resetAt }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      resetAt: bucket.resetAt,
    }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

function pruneIfNeeded(now: number) {
  if (BUCKETS.size < 1000) return
  for (const [k, b] of BUCKETS) {
    if (b.resetAt <= now) BUCKETS.delete(k)
  }
}

export function rateLimitKeyFromRequest(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for")
  const ip = (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim()
  return `${scope}:${ip}`
}

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing_secret" | "no_token" | "rejected"; errors?: string[] }

export async function verifyTurnstile(
  secret: string | null | undefined,
  token: string | null,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  if (!secret) return { ok: false, reason: "missing_secret" }
  if (!token) return { ok: false, reason: "no_token" }

  const body = new URLSearchParams({ secret, response: token })
  if (remoteIp) body.set("remoteip", remoteIp)

  const res = await fetch(VERIFY_URL, { method: "POST", body })
  if (!res.ok) return { ok: false, reason: "rejected", errors: [`http_${res.status}`] }

  const data = (await res.json()) as { success: boolean; "error-codes"?: string[] }
  if (!data.success) return { ok: false, reason: "rejected", errors: data["error-codes"] }
  return { ok: true }
}

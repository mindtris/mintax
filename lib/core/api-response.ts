import { NextResponse } from "next/server"

export type ApiErrorCode =
  | "validation_error"
  | "rate_limited"
  | "turnstile_failed"
  | "cors_denied"
  | "not_found"
  | "conflict"
  | "unauthorized"
  | "internal_error"
  | "expired"

type ErrorDetails = Record<string, unknown> | Array<Record<string, unknown>>

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: ErrorDetails,
  extraHeaders?: HeadersInit
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: extraHeaders }
  )
}

export function apiOk<T extends Record<string, unknown>>(
  data: T,
  status = 200,
  extraHeaders?: HeadersInit
): NextResponse {
  return NextResponse.json({ ok: true, ...data }, { status, headers: extraHeaders })
}

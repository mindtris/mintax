import { NextRequest, NextResponse } from "next/server"

const SELF_HOSTED_PIN_COOKIE = "mintax_sh_auth"

export async function POST(request: NextRequest) {
  const pin = process.env.SELF_HOSTED_PIN
  if (!pin) {
    return NextResponse.json({ error: "PIN not configured" }, { status: 400 })
  }

  const body = await request.json()
  if (body.pin !== pin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SELF_HOSTED_PIN_COOKIE, pin, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  })

  return response
}

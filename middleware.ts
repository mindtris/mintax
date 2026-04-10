import { default as globalConfig } from "@/lib/core/config"
import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

const SELF_HOSTED_PIN_COOKIE = "mintax_sh_auth"

export default async function middleware(request: NextRequest) {
  if (globalConfig.selfHosted.isEnabled) {
    // Self-hosted: require PIN if SELF_HOSTED_PIN is set
    const pin = process.env.SELF_HOSTED_PIN
    if (pin) {
      const authCookie = request.cookies.get(SELF_HOSTED_PIN_COOKIE)?.value
      if (authCookie !== pin) {
        return NextResponse.redirect(new URL("/self-hosted", request.url))
      }
    }
    return NextResponse.next()
  }

  // Cloud mode: require Better Auth session
  const sessionCookie = getSessionCookie(request, { cookiePrefix: "mintax" })
  if (!sessionCookie) {
    return NextResponse.redirect(new URL(globalConfig.auth.loginUrl, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/transactions/:path*",
    "/settings/:path*",
    "/export/:path*",
    "/import/:path*",
    "/unsorted/:path*",
    "/files/:path*",
    "/dashboard/:path*",
    "/organizations/:path*",
    "/bank-accounts/:path*",
    "/invoices/:path*",
    "/reconciliation/:path*",
    "/reports/:path*",
    "/apps/:path*",
    "/engage/:path*",
    "/customers/:path*",
    "/people/:path*",
    "/hire/:path*",
    "/reminders/:path*",
    "/setup-organization/:path*",
  ],
}

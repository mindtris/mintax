import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import config from "@/lib/core/config"
import { getProvider } from "@/lib/integrations/social"
import { createSocialAccount } from "@/lib/services/social-accounts"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params

  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const url = new URL(request.url)
    const action = url.searchParams.get("action")
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const error = url.searchParams.get("error")

    // ── Step 1: Initiate OAuth flow ──────────────────────────────────
    if (action === "connect") {
      const provider = getProvider(providerName)

      if (!provider.requiresOAuth) {
        // Non-OAuth providers are connected via API key in settings
        return NextResponse.redirect(
          new URL(`/settings/social?error=use_api_key&provider=${providerName}`, config.app.baseURL)
        )
      }

      const redirectUri = `${config.app.baseURL}/api/social/callback/${providerName}`
      const auth = await provider.generateAuthUrl(redirectUri)

      // Store state and optional code verifier in cookies
      const cookieStore = await cookies()
      cookieStore.set(`social_oauth_state_${providerName}`, auth.state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
      })

      if (auth.codeVerifier) {
        cookieStore.set(`social_oauth_verifier_${providerName}`, auth.codeVerifier, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 600,
          path: "/",
        })
      }

      return NextResponse.redirect(auth.url)
    }

    // ── Step 2: Handle OAuth error from provider ─────────────────────
    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/social?error=${encodeURIComponent(error)}`, config.app.baseURL)
      )
    }

    // ── Step 3: Handle OAuth callback with code ──────────────────────
    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings/social?error=missing_params", config.app.baseURL)
      )
    }

    // Validate state
    const cookieStore = await cookies()
    const storedState = cookieStore.get(`social_oauth_state_${providerName}`)?.value
    const storedVerifier = cookieStore.get(`social_oauth_verifier_${providerName}`)?.value

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/settings/social?error=invalid_state", config.app.baseURL)
      )
    }

    // Exchange code for tokens
    const provider = getProvider(providerName)
    const redirectUri = `${config.app.baseURL}/api/social/callback/${providerName}`

    const result = await provider.authenticate({
      code,
      redirectUri,
      codeVerifier: storedVerifier,
    })

    // Store the social account
    await createSocialAccount(org.id, {
      provider: providerName,
      providerAccountId: result.providerAccountId,
      name: result.name,
      username: result.username,
      picture: result.picture,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenExpiresAt: result.expiresIn
        ? new Date(Date.now() + result.expiresIn * 1000)
        : undefined,
      scopes: result.scopes,
    })

    // Clear OAuth cookies
    cookieStore.delete(`social_oauth_state_${providerName}`)
    cookieStore.delete(`social_oauth_verifier_${providerName}`)

    return NextResponse.redirect(
      new URL(`/settings/social?connected=${providerName}`, config.app.baseURL)
    )
  } catch (err: any) {
    console.error(`OAuth callback error for ${providerName}:`, err)
    return NextResponse.redirect(
      new URL(`/settings/social?error=${encodeURIComponent(err.message || "auth_failed")}`, config.app.baseURL)
    )
  }
}

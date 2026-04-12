import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getProvider } from "@/lib/integrations/social"
import { createSocialAccount } from "@/lib/services/social-accounts"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/social/connect
 * Connect a non-OAuth provider using API key/token.
 * Body: { provider, apiKey, username?, instanceUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const body = await request.json()

    const { provider: providerName, apiKey, username, instanceUrl } = body

    if (!providerName || !apiKey) {
      return NextResponse.json({ error: "Provider and API key are required" }, { status: 400 })
    }

    const provider = getProvider(providerName)

    if (provider.requiresOAuth) {
      return NextResponse.json({ error: "This provider requires OAuth. Use the connect button instead." }, { status: 400 })
    }

    // For API key providers, we validate by attempting to authenticate
    const result = await provider.authenticate({
      code: apiKey,
      redirectUri: instanceUrl || "",
      codeVerifier: username,
    })

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

    return NextResponse.json({ success: true, provider: providerName, username: result.username })
  } catch (err: any) {
    console.error("Social connect error:", err)
    return NextResponse.json({ error: err.message || "Connection failed" }, { status: 500 })
  }
}

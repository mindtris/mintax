import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class GoogleMyBusinessProvider implements SocialProvider {
  identifier = "gmb"
  name = "Google My Business"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 1500
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 1
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientId = (config.social as any).google?.clientId
    if (!clientId) throw new Error("Google client ID not configured")
    const state = randomUUID()
    const params = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri, response_type: "code",
      scope: "https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile",
      state, access_type: "offline", prompt: "consent",
    })
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state }
  }

  async authenticate(params: { code: string; redirectUri: string }): Promise<SocialProviderTokenResult> {
    const clientId = (config.social as any).google?.clientId
    const clientSecret = (config.social as any).google?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Google credentials not configured")
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: params.code, client_id: clientId, client_secret: clientSecret, redirect_uri: params.redirectUri, grant_type: "authorization_code" }).toString(),
    })
    if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`)
    const data = await res.json()
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${data.access_token}` } })
    const user = userRes.ok ? await userRes.json() : {}
    return { providerAccountId: user.id || "", name: user.name || "GMB User", username: user.email || "", picture: user.picture, accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in }
  }

  async refreshToken(refreshToken: string) {
    const clientId = (config.social as any).google?.clientId
    const clientSecret = (config.social as any).google?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Google credentials not configured")
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString(),
    })
    if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`)
    const data = await res.json()
    return { accessToken: data.access_token, expiresIn: data.expires_in }
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const locationId = params.settings?.locationId
    if (!locationId) throw new Error("Google My Business location ID is required")
    const res = await fetch(`https://mybusiness.googleapis.com/v4/${locationId}/localPosts`, {
      method: "POST", headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ languageCode: "en", summary: params.content, topicType: "STANDARD" }),
    })
    if (!res.ok) throw new Error(`GMB post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: data.name || "", externalUrl: data.searchUrl || "" }
  }
}

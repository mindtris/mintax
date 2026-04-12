import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class DribbbleProvider implements SocialProvider {
  identifier = "dribbble"
  name = "Dribbble"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 500
  supportedMediaTypes = ["image" as const, "gif" as const]
  maxMediaCount = 1
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientId = (config.social as any).dribbble?.clientId
    if (!clientId) throw new Error("Dribbble client ID not configured")
    const state = randomUUID()
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: "public upload", state })
    return { url: `https://dribbble.com/oauth/authorize?${params.toString()}`, state }
  }

  async authenticate(params: { code: string; redirectUri: string }): Promise<SocialProviderTokenResult> {
    const clientId = (config.social as any).dribbble?.clientId
    const clientSecret = (config.social as any).dribbble?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Dribbble credentials not configured")
    const res = await fetch("https://dribbble.com/oauth/token", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: params.code, redirect_uri: params.redirectUri }),
    })
    if (!res.ok) throw new Error(`Dribbble token exchange failed: ${await res.text()}`)
    const data = await res.json()
    const userRes = await fetch("https://api.dribbble.com/v2/user", { headers: { Authorization: `Bearer ${data.access_token}` } })
    const user = userRes.ok ? await userRes.json() : {}
    return { providerAccountId: String(user.id || ""), name: user.name || "Dribbble User", username: user.login || "", picture: user.avatar_url, accessToken: data.access_token }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Dribbble tokens don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    throw new Error("Dribbble shot upload requires image via multipart form — use the Dribbble API directly")
  }
}

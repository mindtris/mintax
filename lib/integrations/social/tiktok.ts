import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
const TIKTOK_API_URL = "https://open.tiktokapis.com/v2"

export class TikTokProvider implements SocialProvider {
  identifier = "tiktok"
  name = "TikTok"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 4000
  supportedMediaTypes = ["video" as const]
  maxMediaCount = 1
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientKey = (config.social as any).tiktok?.clientKey
    if (!clientKey) throw new Error("TikTok client key not configured")

    const state = randomUUID()
    const scopes = ["user.info.basic", "video.publish", "video.upload"]

    const params = new URLSearchParams({
      client_key: clientKey,
      response_type: "code",
      scope: scopes.join(","),
      redirect_uri: redirectUri,
      state,
    })

    return {
      url: `${TIKTOK_AUTH_URL}?${params.toString()}`,
      state,
    }
  }

  async authenticate(params: { code: string; redirectUri: string }): Promise<SocialProviderTokenResult> {
    const clientKey = (config.social as any).tiktok?.clientKey
    const clientSecret = (config.social as any).tiktok?.clientSecret
    if (!clientKey || !clientSecret) throw new Error("TikTok credentials not configured")

    const res = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: params.code,
        grant_type: "authorization_code",
        redirect_uri: params.redirectUri,
      }).toString(),
    })

    if (!res.ok) throw new Error(`TikTok token exchange failed: ${await res.text()}`)
    const data = await res.json()

    const userRes = await fetch(`${TIKTOK_API_URL}/user/info/?fields=open_id,union_id,avatar_url,display_name,username`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })

    const userData = userRes.ok ? await userRes.json() : { data: { user: {} } }
    const user = userData.data?.user || {}

    return {
      providerAccountId: data.open_id || user.open_id || "",
      name: user.display_name || "TikTok User",
      username: user.username || "",
      picture: user.avatar_url,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scopes: data.scope,
    }
  }

  async refreshToken(refreshToken: string) {
    const clientKey = (config.social as any).tiktok?.clientKey
    const clientSecret = (config.social as any).tiktok?.clientSecret
    if (!clientKey || !clientSecret) throw new Error("TikTok credentials not configured")

    const res = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    })

    if (!res.ok) throw new Error(`TikTok token refresh failed: ${await res.text()}`)
    const data = await res.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    // TikTok requires video upload via their Content Posting API
    throw new Error("TikTok publishing requires video upload via Content Posting API")
  }
}

import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

export class YouTubeProvider implements SocialProvider {
  identifier = "youtube"
  name = "YouTube"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 5000
  supportedMediaTypes = ["video" as const]
  maxMediaCount = 1
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientId = (config.social as any).google?.clientId
    if (!clientId) throw new Error("Google client ID not configured")

    const state = randomUUID()
    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
    ]

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      state,
      access_type: "offline",
      prompt: "consent",
    })

    return { url: `${GOOGLE_AUTH_URL}?${params.toString()}`, state }
  }

  async authenticate(params: { code: string; redirectUri: string }): Promise<SocialProviderTokenResult> {
    const clientId = (config.social as any).google?.clientId
    const clientSecret = (config.social as any).google?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Google credentials not configured")

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: params.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: params.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    })

    if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`)
    const data = await res.json()

    // Fetch channel info
    const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })

    let channelName = "YouTube Channel"
    let channelId = ""
    let picture = ""

    if (channelRes.ok) {
      const channelData = await channelRes.json()
      const channel = channelData.items?.[0]
      if (channel) {
        channelName = channel.snippet?.title || channelName
        channelId = channel.id
        picture = channel.snippet?.thumbnails?.default?.url || ""
      }
    }

    return {
      providerAccountId: channelId,
      name: channelName,
      username: channelId,
      picture,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  }

  async refreshToken(refreshToken: string) {
    const clientId = (config.social as any).google?.clientId
    const clientSecret = (config.social as any).google?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Google credentials not configured")

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    })

    if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`)
    const data = await res.json()

    return { accessToken: data.access_token, expiresIn: data.expires_in }
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    throw new Error("YouTube publishing requires video upload via resumable upload API")
  }
}

import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class PinterestProvider implements SocialProvider {
  identifier = "pinterest"
  name = "Pinterest"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 500
  supportedMediaTypes = ["image" as const, "video" as const]
  maxMediaCount = 1
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientId = (config.social as any).pinterest?.clientId
    if (!clientId) throw new Error("Pinterest client ID not configured")
    const state = randomUUID()
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "boards:read,pins:read,pins:write,user_accounts:read",
      state,
    })
    return { url: `https://www.pinterest.com/oauth/?${params.toString()}`, state }
  }

  async authenticate(params: { code: string; redirectUri: string }): Promise<SocialProviderTokenResult> {
    const clientId = (config.social as any).pinterest?.clientId
    const clientSecret = (config.social as any).pinterest?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Pinterest credentials not configured")

    const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code: params.code, redirect_uri: params.redirectUri }).toString(),
    })
    if (!res.ok) throw new Error(`Pinterest token exchange failed: ${await res.text()}`)
    const data = await res.json()

    const userRes = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    const user = userRes.ok ? await userRes.json() : {}

    return {
      providerAccountId: user.id || "",
      name: user.business_name || user.username || "Pinterest User",
      username: user.username || "",
      picture: user.profile_image,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  }

  async refreshToken(refreshToken: string) {
    const clientId = (config.social as any).pinterest?.clientId
    const clientSecret = (config.social as any).pinterest?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Pinterest credentials not configured")
    const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }).toString(),
    })
    if (!res.ok) throw new Error(`Pinterest token refresh failed: ${await res.text()}`)
    const data = await res.json()
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in }
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const body: any = { title: params.title || "", description: params.content, board_id: params.settings?.boardId }
    if (params.media?.[0]) body.media_source = { source_type: "url", url: params.settings?.imageUrl }
    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Pinterest post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: data.id, externalUrl: `https://www.pinterest.com/pin/${data.id}/` }
  }
}

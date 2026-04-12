import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class RedditProvider implements SocialProvider {
  identifier = "reddit"
  name = "Reddit"
  category = "social" as const
  supportedContentTypes = ["post" as const, "article" as const]
  maxContentLength = 40000
  supportedMediaTypes = ["image" as const, "video" as const, "gif" as const]
  maxMediaCount = 20
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientId = (config.social as any).reddit?.clientId
    if (!clientId) throw new Error("Reddit client ID not configured")
    const state = randomUUID()
    const params = new URLSearchParams({
      client_id: clientId, response_type: "code", state,
      redirect_uri: redirectUri, duration: "permanent",
      scope: "identity submit read",
    })
    return { url: `https://www.reddit.com/api/v1/authorize?${params.toString()}`, state }
  }

  async authenticate(params: { code: string; redirectUri: string }): Promise<SocialProviderTokenResult> {
    const clientId = (config.social as any).reddit?.clientId
    const clientSecret = (config.social as any).reddit?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Reddit credentials not configured")
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}` },
      body: new URLSearchParams({ grant_type: "authorization_code", code: params.code, redirect_uri: params.redirectUri }).toString(),
    })
    if (!res.ok) throw new Error(`Reddit token exchange failed: ${await res.text()}`)
    const data = await res.json()
    const userRes = await fetch("https://oauth.reddit.com/api/v1/me", { headers: { Authorization: `Bearer ${data.access_token}`, "User-Agent": "Mintax/1.0" } })
    const user = userRes.ok ? await userRes.json() : {}
    return {
      providerAccountId: user.id || "", name: user.name || "Reddit User", username: user.name || "",
      picture: user.icon_img?.split("?")?.[0], accessToken: data.access_token,
      refreshToken: data.refresh_token, expiresIn: data.expires_in,
    }
  }

  async refreshToken(refreshToken: string) {
    const clientId = (config.social as any).reddit?.clientId
    const clientSecret = (config.social as any).reddit?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Reddit credentials not configured")
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }).toString(),
    })
    if (!res.ok) throw new Error(`Reddit token refresh failed: ${await res.text()}`)
    const data = await res.json()
    return { accessToken: data.access_token, expiresIn: data.expires_in }
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const subreddit = params.settings?.subreddit || "test"
    const body = new URLSearchParams({
      sr: subreddit, kind: "self", title: params.title || params.content.slice(0, 300),
      text: params.content, api_type: "json",
    })
    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: { Authorization: `Bearer ${params.accessToken}`, "User-Agent": "Mintax/1.0", "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    if (!res.ok) throw new Error(`Reddit post failed: ${await res.text()}`)
    const data = await res.json()
    const postUrl = data.json?.data?.url || ""
    const postId = data.json?.data?.id || data.json?.data?.name || ""
    return { externalPostId: postId, externalUrl: postUrl }
  }
}

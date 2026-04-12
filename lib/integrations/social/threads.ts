import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class ThreadsProvider implements SocialProvider {
  identifier = "threads"
  name = "Threads"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 500
  supportedMediaTypes = ["image" as const, "video" as const]
  maxMediaCount = 10
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const appId = config.social.facebook.appId
    if (!appId) throw new Error("Facebook App ID not configured (required for Threads)")
    const state = randomUUID()
    const params = new URLSearchParams({
      client_id: appId, redirect_uri: redirectUri, response_type: "code", scope: "threads_basic,threads_content_publish,threads_manage_insights", state,
    })
    return { url: `https://threads.net/oauth/authorize?${params.toString()}`, state }
  }

  async authenticate(params: { code: string; redirectUri: string }): Promise<SocialProviderTokenResult> {
    const appId = config.social.facebook.appId
    const appSecret = config.social.facebook.appSecret
    if (!appId || !appSecret) throw new Error("Facebook credentials not configured")
    const res = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: appId, client_secret: appSecret, code: params.code, grant_type: "authorization_code", redirect_uri: params.redirectUri }).toString(),
    })
    if (!res.ok) throw new Error(`Threads token exchange failed: ${await res.text()}`)
    const data = await res.json()

    // Exchange for long-lived token
    const longRes = await fetch(`https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret}&access_token=${data.access_token}`)
    const longData = longRes.ok ? await longRes.json() : data

    const userRes = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,name&access_token=${longData.access_token || data.access_token}`)
    const user = userRes.ok ? await userRes.json() : {}

    return {
      providerAccountId: user.id || data.user_id || "",
      name: user.name || user.username || "Threads User",
      username: user.username || "",
      picture: user.threads_profile_picture_url,
      accessToken: longData.access_token || data.access_token,
      expiresIn: longData.expires_in,
    }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    throw new Error("Threads uses long-lived tokens. Reconnect when expired.")
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    // Step 1: Create media container
    const createRes = await fetch(`https://graph.threads.net/v1.0/me/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: params.content, media_type: "TEXT", access_token: params.accessToken }),
    })
    if (!createRes.ok) throw new Error(`Threads container creation failed: ${await createRes.text()}`)
    const container = await createRes.json()

    // Step 2: Publish
    const publishRes = await fetch(`https://graph.threads.net/v1.0/me/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token: params.accessToken }),
    })
    if (!publishRes.ok) throw new Error(`Threads publish failed: ${await publishRes.text()}`)
    const post = await publishRes.json()

    return { externalPostId: post.id, externalUrl: `https://www.threads.net/post/${post.id}` }
  }
}

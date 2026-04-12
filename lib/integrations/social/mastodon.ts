import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class MastodonProvider implements SocialProvider {
  identifier = "mastodon"
  name = "Mastodon"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 500
  supportedMediaTypes = ["image" as const, "video" as const, "gif" as const]
  maxMediaCount = 4
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> {
    throw new Error("Mastodon uses access tokens. Enter your instance URL and token in settings.")
  }

  /** code = access token, redirectUri = instance URL, codeVerifier = username */
  async authenticate(params: { code: string; redirectUri: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const instanceUrl = params.redirectUri?.replace(/\/+$/, "")
    const accessToken = params.code
    if (!instanceUrl || !accessToken) throw new Error("Mastodon instance URL and access token are required")

    const res = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`Mastodon auth failed: ${await res.text()}`)
    const user = await res.json()

    return {
      providerAccountId: user.id,
      name: user.display_name || user.username,
      username: `${user.username}@${new URL(instanceUrl).hostname}`,
      picture: user.avatar,
      accessToken,
      scopes: `instance:${instanceUrl}`,
    }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Mastodon tokens don't expire. Reconnect if revoked.") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const instanceUrl = params.settings?.instanceUrl || ""
    const res = await fetch(`${instanceUrl}/api/v1/statuses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: params.content, visibility: params.settings?.visibility || "public" }),
    })
    if (!res.ok) throw new Error(`Mastodon post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: data.id, externalUrl: data.url }
  }
}

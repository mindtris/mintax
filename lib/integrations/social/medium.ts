import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class MediumProvider implements SocialProvider {
  identifier = "medium"
  name = "Medium"
  category = "blog" as const
  supportedContentTypes = ["article" as const]
  maxContentLength = -1
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 50
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Medium uses integration tokens") }

  /** code = integration token */
  async authenticate(params: { code: string }): Promise<SocialProviderTokenResult> {
    const token = params.code
    if (!token) throw new Error("Medium integration token is required")
    const res = await fetch("https://api.medium.com/v1/me", { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`Medium auth failed: ${await res.text()}`)
    const { data: user } = await res.json()
    return { providerAccountId: user.id, name: user.name, username: user.username, picture: user.imageUrl, accessToken: token }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Medium integration tokens don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    // Get user ID first
    const meRes = await fetch("https://api.medium.com/v1/me", { headers: { Authorization: `Bearer ${params.accessToken}` } })
    if (!meRes.ok) throw new Error("Failed to fetch Medium user")
    const { data: me } = await meRes.json()
    const res = await fetch(`https://api.medium.com/v1/users/${me.id}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: params.title || params.content.slice(0, 100),
        contentFormat: "markdown", content: params.content,
        tags: params.tags || [], publishStatus: params.settings?.draft ? "draft" : "public",
      }),
    })
    if (!res.ok) throw new Error(`Medium post failed: ${await res.text()}`)
    const { data } = await res.json()
    return { externalPostId: data.id, externalUrl: data.url }
  }
}

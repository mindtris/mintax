import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class WordPressProvider implements SocialProvider {
  identifier = "wordpress"
  name = "WordPress"
  category = "blog" as const
  supportedContentTypes = ["article" as const, "page" as const]
  maxContentLength = -1
  supportedMediaTypes = ["image" as const, "video" as const]
  maxMediaCount = 50
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("WordPress uses application passwords") }

  /** code = application password, redirectUri = site URL, codeVerifier = username */
  async authenticate(params: { code: string; redirectUri: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const siteUrl = params.redirectUri?.replace(/\/+$/, "")
    const username = params.codeVerifier || ""
    const appPassword = params.code
    if (!siteUrl || !username || !appPassword) throw new Error("WordPress site URL, username, and application password are required")

    const res = await fetch(`${siteUrl}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Basic ${btoa(`${username}:${appPassword}`)}` },
    })
    if (!res.ok) throw new Error(`WordPress auth failed: ${await res.text()}`)
    const user = await res.json()

    return {
      providerAccountId: String(user.id),
      name: user.name,
      username: user.slug,
      picture: user.avatar_urls?.["96"],
      accessToken: btoa(`${username}:${appPassword}`),
      scopes: `site:${siteUrl}`,
    }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("WordPress application passwords don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const siteUrl = params.settings?.siteUrl || ""
    const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { Authorization: `Basic ${params.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: params.title || "", content: params.content,
        status: params.settings?.draft ? "draft" : "publish",
        tags: params.tags, excerpt: params.excerpt,
      }),
    })
    if (!res.ok) throw new Error(`WordPress post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: String(data.id), externalUrl: data.link }
  }
}

import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class DevToProvider implements SocialProvider {
  identifier = "devto"
  name = "Dev.to"
  category = "blog" as const
  supportedContentTypes = ["article" as const]
  maxContentLength = -1
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 50
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Dev.to uses API keys") }

  async authenticate(params: { code: string }): Promise<SocialProviderTokenResult> {
    const apiKey = params.code
    if (!apiKey) throw new Error("Dev.to API key is required")
    const res = await fetch("https://dev.to/api/users/me", { headers: { "api-key": apiKey } })
    if (!res.ok) throw new Error(`Dev.to auth failed: ${await res.text()}`)
    const user = await res.json()
    return { providerAccountId: String(user.id), name: user.name, username: user.username, picture: user.profile_image, accessToken: apiKey }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Dev.to API keys don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: { "api-key": params.accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        article: {
          title: params.title || params.content.slice(0, 100),
          body_markdown: params.content,
          published: !params.settings?.draft,
          tags: params.tags || [],
        },
      }),
    })
    if (!res.ok) throw new Error(`Dev.to post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: String(data.id), externalUrl: data.url }
  }
}

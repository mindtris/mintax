import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class DiscordProvider implements SocialProvider {
  identifier = "discord"
  name = "Discord"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 2000
  supportedMediaTypes = ["image" as const, "video" as const, "gif" as const]
  maxMediaCount = 10
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Discord uses webhook URLs") }

  /** code = webhook URL */
  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const webhookUrl = params.code
    if (!webhookUrl?.includes("discord.com/api/webhooks/")) throw new Error("Invalid Discord webhook URL")
    // Validate webhook
    const res = await fetch(webhookUrl)
    if (!res.ok) throw new Error(`Discord webhook validation failed: ${await res.text()}`)
    const webhook = await res.json()
    return {
      providerAccountId: webhook.id,
      name: webhook.name || "Discord Webhook",
      username: webhook.name || "webhook",
      picture: webhook.avatar ? `https://cdn.discordapp.com/avatars/${webhook.id}/${webhook.avatar}.png` : undefined,
      accessToken: webhookUrl,
    }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Discord webhooks don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const res = await fetch(`${params.accessToken}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: params.content }),
    })
    if (!res.ok) throw new Error(`Discord post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: data.id, externalUrl: "" }
  }
}

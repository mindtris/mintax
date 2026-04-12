import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class SlackProvider implements SocialProvider {
  identifier = "slack"
  name = "Slack"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 40000
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 10
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Slack uses webhook URLs") }

  /** code = webhook URL */
  async authenticate(params: { code: string }): Promise<SocialProviderTokenResult> {
    const webhookUrl = params.code
    if (!webhookUrl?.includes("hooks.slack.com")) throw new Error("Invalid Slack webhook URL")
    // Test webhook
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    })
    return {
      providerAccountId: webhookUrl.split("/").pop() || "",
      name: "Slack Webhook",
      username: "slack-webhook",
      accessToken: webhookUrl,
    }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Slack webhooks don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const res = await fetch(params.accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: params.content }),
    })
    if (!res.ok) throw new Error(`Slack post failed: ${await res.text()}`)
    return { externalPostId: Date.now().toString(), externalUrl: "" }
  }
}

import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

const TG_API = "https://api.telegram.org"

export class TelegramProvider implements SocialProvider {
  identifier = "telegram"
  name = "Telegram"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 4096
  supportedMediaTypes = ["image" as const, "video" as const, "gif" as const]
  maxMediaCount = 10
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Telegram uses bot tokens") }

  /** code = bot token, codeVerifier = chat ID */
  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const botToken = params.code
    const chatId = params.codeVerifier || ""
    if (!botToken) throw new Error("Telegram bot token is required")
    const res = await fetch(`${TG_API}/bot${botToken}/getMe`)
    if (!res.ok) throw new Error(`Telegram auth failed: ${await res.text()}`)
    const { result: bot } = await res.json()
    return {
      providerAccountId: String(bot.id),
      name: bot.first_name || "Telegram Bot",
      username: bot.username || "",
      accessToken: botToken,
      scopes: chatId ? `chat:${chatId}` : "",
    }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Telegram bot tokens don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const chatId = params.settings?.chatId || ""
    if (!chatId) throw new Error("Telegram chat ID is required")
    const res = await fetch(`${TG_API}/bot${params.accessToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: params.content, parse_mode: "Markdown" }),
    })
    if (!res.ok) throw new Error(`Telegram post failed: ${await res.text()}`)
    const { result } = await res.json()
    return { externalPostId: String(result.message_id), externalUrl: "" }
  }
}

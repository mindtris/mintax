/**
 * Niche/community social providers.
 * Each follows the SocialProvider interface. API-key based providers
 * use code=apiKey, codeVerifier=username, redirectUri=instanceUrl convention.
 */

import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import {
  SocialProvider,
  SocialProviderAuthUrl,
  SocialProviderTokenResult,
  SocialProviderPostResult,
  PublishParams,
} from "./types"

// ── Twitch ──────────────────────────────────────────────────────────────────

export class TwitchProvider implements SocialProvider {
  identifier = "twitch"
  name = "Twitch"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 500
  supportedMediaTypes = []
  maxMediaCount = 0
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientId = (config.social as any).twitch?.clientId
    if (!clientId) throw new Error("Twitch client ID not configured")
    const state = randomUUID()
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "user:read:email channel:manage:broadcast", state })
    return { url: `https://id.twitch.tv/oauth2/authorize?${params.toString()}`, state }
  }

  async authenticate(params: { code: string; redirectUri: string }): Promise<SocialProviderTokenResult> {
    const clientId = (config.social as any).twitch?.clientId
    const clientSecret = (config.social as any).twitch?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Twitch credentials not configured")
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code: params.code, grant_type: "authorization_code", redirect_uri: params.redirectUri }).toString(),
    })
    if (!res.ok) throw new Error(`Twitch token exchange failed: ${await res.text()}`)
    const data = await res.json()
    const userRes = await fetch("https://api.twitch.tv/helix/users", { headers: { Authorization: `Bearer ${data.access_token}`, "Client-Id": clientId } })
    const userData = userRes.ok ? await userRes.json() : { data: [{}] }
    const user = userData.data?.[0] || {}
    return { providerAccountId: user.id || "", name: user.display_name || "Twitch User", username: user.login || "", picture: user.profile_image_url, accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in }
  }

  async refreshToken(refreshToken: string) {
    const clientId = (config.social as any).twitch?.clientId
    const clientSecret = (config.social as any).twitch?.clientSecret
    if (!clientId || !clientSecret) throw new Error("Twitch credentials not configured")
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: refreshToken }).toString(),
    })
    if (!res.ok) throw new Error(`Twitch token refresh failed: ${await res.text()}`)
    const data = await res.json()
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in }
  }

  async publishPost(_params: PublishParams): Promise<SocialProviderPostResult> {
    throw new Error("Twitch posting requires chat bot or channel point redemption API")
  }
}

// ── Lemmy ───────────────────────────────────────────────────────────────────

export class LemmyProvider implements SocialProvider {
  identifier = "lemmy"
  name = "Lemmy"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 40000
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 1
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Lemmy uses username/password auth") }

  /** code = password, redirectUri = instance URL, codeVerifier = username */
  async authenticate(params: { code: string; redirectUri: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const instanceUrl = params.redirectUri?.replace(/\/+$/, "")
    const username = params.codeVerifier || ""
    const password = params.code
    if (!instanceUrl || !username || !password) throw new Error("Lemmy instance URL, username, and password are required")
    const res = await fetch(`${instanceUrl}/api/v3/user/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username_or_email: username, password }),
    })
    if (!res.ok) throw new Error(`Lemmy auth failed: ${await res.text()}`)
    const data = await res.json()
    return { providerAccountId: username, name: username, username: `${username}@${new URL(instanceUrl).hostname}`, accessToken: data.jwt, scopes: `instance:${instanceUrl}` }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Lemmy tokens — re-login required") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const instanceUrl = params.settings?.instanceUrl || ""
    const communityId = params.settings?.communityId
    if (!instanceUrl || !communityId) throw new Error("Lemmy instance URL and community ID are required")
    const res = await fetch(`${instanceUrl}/api/v3/post`, {
      method: "POST", headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: params.title || params.content.slice(0, 200), body: params.content, community_id: Number(communityId) }),
    })
    if (!res.ok) throw new Error(`Lemmy post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: String(data.post_view?.post?.id || ""), externalUrl: `${instanceUrl}/post/${data.post_view?.post?.id}` }
  }
}

// ── VK (VKontakte) ──────────────────────────────────────────────────────────

export class VKProvider implements SocialProvider {
  identifier = "vk"
  name = "VK"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 15895
  supportedMediaTypes = ["image" as const, "video" as const]
  maxMediaCount = 10
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("VK uses access tokens") }

  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const token = params.code
    if (!token) throw new Error("VK access token is required")
    const res = await fetch(`https://api.vk.com/method/users.get?fields=photo_100,screen_name&access_token=${token}&v=5.199`)
    if (!res.ok) throw new Error(`VK auth failed: ${await res.text()}`)
    const { response } = await res.json()
    const user = response?.[0] || {}
    return { providerAccountId: String(user.id || ""), name: `${user.first_name || ""} ${user.last_name || ""}`.trim(), username: user.screen_name || String(user.id || ""), picture: user.photo_100, accessToken: token }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("VK tokens — regenerate from app settings") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const ownerId = params.settings?.ownerId || ""
    const res = await fetch(`https://api.vk.com/method/wall.post?owner_id=${ownerId}&message=${encodeURIComponent(params.content)}&access_token=${params.accessToken}&v=5.199`, { method: "POST" })
    if (!res.ok) throw new Error(`VK post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: String(data.response?.post_id || ""), externalUrl: `https://vk.com/wall${ownerId}_${data.response?.post_id}` }
  }
}

// ── Farcaster ───────────────────────────────────────────────────────────────

export class FarcasterProvider implements SocialProvider {
  identifier = "farcaster"
  name = "Farcaster"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 320
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 2
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Farcaster uses signer keys") }

  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const signerUuid = params.code
    if (!signerUuid) throw new Error("Farcaster signer UUID (from Neynar) is required")
    return { providerAccountId: signerUuid.slice(0, 16), name: params.codeVerifier || "Farcaster User", username: params.codeVerifier || "farcaster", accessToken: signerUuid }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Farcaster signers don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    // Uses Neynar API
    const res = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: { "Content-Type": "application/json", api_key: params.settings?.neynarApiKey || "" },
      body: JSON.stringify({ signer_uuid: params.accessToken, text: params.content }),
    })
    if (!res.ok) throw new Error(`Farcaster post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: data.cast?.hash || "", externalUrl: `https://warpcast.com/~/conversations/${data.cast?.hash}` }
  }
}

// ── Kick ────────────────────────────────────────────────────────────────────

export class KickProvider implements SocialProvider {
  identifier = "kick"
  name = "Kick"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 500
  supportedMediaTypes = []
  maxMediaCount = 0
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Kick uses API tokens") }

  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    return { providerAccountId: params.codeVerifier || "kick-user", name: params.codeVerifier || "Kick User", username: params.codeVerifier || "", accessToken: params.code }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Kick tokens don't expire") }

  async publishPost(_params: PublishParams): Promise<SocialProviderPostResult> {
    throw new Error("Kick chatbot posting requires WebSocket connection")
  }
}

// ── MeWe ────────────────────────────────────────────────────────────────────

export class MeWeProvider implements SocialProvider {
  identifier = "mewe"
  name = "MeWe"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 63206
  supportedMediaTypes = ["image" as const, "video" as const]
  maxMediaCount = 10
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("MeWe uses API tokens") }

  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    return { providerAccountId: params.codeVerifier || "mewe-user", name: params.codeVerifier || "MeWe User", username: params.codeVerifier || "", accessToken: params.code }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("MeWe tokens — regenerate from app settings") }

  async publishPost(_params: PublishParams): Promise<SocialProviderPostResult> {
    throw new Error("MeWe API access requires partnership approval")
  }
}

// ── Skool ───────────────────────────────────────────────────────────────────

export class SkoolProvider implements SocialProvider {
  identifier = "skool"
  name = "Skool"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 10000
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 10
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Skool uses API tokens") }

  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    return { providerAccountId: params.codeVerifier || "skool-user", name: params.codeVerifier || "Skool User", username: params.codeVerifier || "", accessToken: params.code }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Skool tokens don't expire") }

  async publishPost(_params: PublishParams): Promise<SocialProviderPostResult> {
    throw new Error("Skool API is not publicly available — use browser automation")
  }
}

import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, SocialProviderAnalytics, PublishParams } from "./types"

const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize"
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token"
const TWITTER_API_URL = "https://api.twitter.com/2"

function generateCodeVerifier(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  let result = ""
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export class TwitterProvider implements SocialProvider {
  identifier = "twitter"
  name = "X (Twitter)"
  category = "social" as const
  supportedContentTypes = ["post" as const, "thread" as const]
  maxContentLength = 280
  supportedMediaTypes = ["image" as const, "video" as const, "gif" as const]
  maxMediaCount = 4
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientId = config.social.twitter.clientId
    if (!clientId) throw new Error("Twitter client ID not configured")

    const state = randomUUID()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    const scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"]

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    return {
      url: `${TWITTER_AUTH_URL}?${params.toString()}`,
      state,
      codeVerifier,
    }
  }

  async authenticate(params: {
    code: string
    redirectUri: string
    codeVerifier?: string
  }): Promise<SocialProviderTokenResult> {
    const clientId = config.social.twitter.clientId
    const clientSecret = config.social.twitter.clientSecret
    if (!clientId || !clientSecret) throw new Error("Twitter credentials not configured")

    // Exchange code for tokens
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: clientId,
      code_verifier: params.codeVerifier || "",
    })

    const tokenRes = await fetch(TWITTER_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: tokenBody.toString(),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      throw new Error(`Twitter token exchange failed: ${err}`)
    }

    const tokenData = await tokenRes.json()

    // Fetch user profile
    const userRes = await fetch(`${TWITTER_API_URL}/users/me?user.fields=profile_image_url,username,name`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) {
      throw new Error("Failed to fetch Twitter user profile")
    }

    const userData = await userRes.json()

    return {
      providerAccountId: userData.data.id,
      name: userData.data.name,
      username: userData.data.username,
      picture: userData.data.profile_image_url,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scopes: tokenData.scope,
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
  }> {
    const clientId = config.social.twitter.clientId
    const clientSecret = config.social.twitter.clientSecret
    if (!clientId || !clientSecret) throw new Error("Twitter credentials not configured")

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    })

    const res = await fetch(TWITTER_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: body.toString(),
    })

    if (!res.ok) {
      throw new Error(`Twitter token refresh failed: ${await res.text()}`)
    }

    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const body: any = { text: params.content }

    // TODO: Handle media upload via Twitter media upload endpoint
    // TODO: Handle threads (contentType === "thread")

    const res = await fetch(`${TWITTER_API_URL}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Twitter post failed: ${err}`)
    }

    const data = await res.json()
    return {
      externalPostId: data.data.id,
      externalUrl: `https://x.com/i/status/${data.data.id}`,
    }
  }

  async deletePost(params: { accessToken: string; externalPostId: string }): Promise<void> {
    const res = await fetch(`${TWITTER_API_URL}/tweets/${params.externalPostId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${params.accessToken}` },
    })

    if (!res.ok) {
      throw new Error(`Twitter delete failed: ${await res.text()}`)
    }
  }

  async getPostAnalytics(params: {
    accessToken: string
    externalPostId: string
  }): Promise<SocialProviderAnalytics> {
    const res = await fetch(
      `${TWITTER_API_URL}/tweets/${params.externalPostId}?tweet.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${params.accessToken}` } }
    )

    if (!res.ok) {
      return { impressions: 0, engagements: 0, likes: 0, shares: 0, comments: 0, clicks: 0, reach: 0 }
    }

    const data = await res.json()
    const metrics = data.data?.public_metrics || {}

    return {
      impressions: metrics.impression_count || 0,
      engagements: (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0),
      likes: metrics.like_count || 0,
      shares: metrics.retweet_count || 0,
      comments: metrics.reply_count || 0,
      clicks: 0,
      reach: metrics.impression_count || 0,
      extra: { quotes: metrics.quote_count || 0, bookmarks: metrics.bookmark_count || 0 },
    }
  }
}

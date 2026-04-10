import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

const FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth"
const FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token"
const FB_API_URL = "https://graph.facebook.com/v19.0"

export class FacebookProvider implements SocialProvider {
  identifier = "facebook"
  name = "Facebook"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 63206
  supportedMediaTypes = ["image" as const, "video" as const]
  maxMediaCount = 10
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const appId = config.social.facebook.appId
    if (!appId) throw new Error("Facebook App ID not configured")

    const state = randomUUID()
    const scopes = ["pages_manage_posts", "pages_read_engagement", "pages_show_list"]

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: scopes.join(","),
      state,
      response_type: "code",
    })

    return { url: `${FB_AUTH_URL}?${params.toString()}`, state }
  }

  async authenticate(params: {
    code: string
    redirectUri: string
  }): Promise<SocialProviderTokenResult> {
    const appId = config.social.facebook.appId
    const appSecret = config.social.facebook.appSecret
    if (!appId || !appSecret) throw new Error("Facebook credentials not configured")

    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: params.redirectUri,
      code: params.code,
    })

    const tokenRes = await fetch(`${FB_TOKEN_URL}?${tokenParams.toString()}`)
    if (!tokenRes.ok) throw new Error(`Facebook token exchange failed: ${await tokenRes.text()}`)
    const tokenData = await tokenRes.json()

    const userRes = await fetch(`${FB_API_URL}/me?fields=id,name,picture&access_token=${tokenData.access_token}`)
    if (!userRes.ok) throw new Error("Failed to fetch Facebook profile")
    const userData = await userRes.json()

    return {
      providerAccountId: userData.id,
      name: userData.name,
      username: userData.id,
      picture: userData.picture?.data?.url,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    }
  }

  async refreshToken(_refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
  }> {
    throw new Error("Facebook uses long-lived tokens — re-authenticate instead")
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const res = await fetch(`${FB_API_URL}/me/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: params.content,
        access_token: params.accessToken,
      }),
    })

    if (!res.ok) throw new Error(`Facebook post failed: ${await res.text()}`)
    const data = await res.json()

    return {
      externalPostId: data.id,
      externalUrl: `https://facebook.com/${data.id}`,
    }
  }
}

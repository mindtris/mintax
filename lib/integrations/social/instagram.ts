import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

const FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth"
const FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token"
const FB_API_URL = "https://graph.facebook.com/v19.0"

export class InstagramProvider implements SocialProvider {
  identifier = "instagram"
  name = "Instagram"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 2200
  supportedMediaTypes = ["image" as const, "video" as const]
  maxMediaCount = 10
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const appId = config.social.facebook.appId
    if (!appId) throw new Error("Facebook/Instagram App ID not configured")

    const state = randomUUID()
    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
    ]

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
    if (!appId || !appSecret) throw new Error("Facebook/Instagram credentials not configured")

    // Exchange code for short-lived token
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: params.redirectUri,
      code: params.code,
    })

    const tokenRes = await fetch(`${FB_TOKEN_URL}?${tokenParams.toString()}`)
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`)
    const tokenData = await tokenRes.json()

    // Get long-lived token
    const longLivedParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: tokenData.access_token,
    })
    const longLivedRes = await fetch(`${FB_TOKEN_URL}?${longLivedParams.toString()}`)
    const longLivedData = longLivedRes.ok ? await longLivedRes.json() : tokenData

    // Get Instagram Business account via Facebook Pages
    const pagesRes = await fetch(
      `${FB_API_URL}/me/accounts?fields=instagram_business_account,name,picture&access_token=${longLivedData.access_token}`
    )
    if (!pagesRes.ok) throw new Error("Failed to fetch Facebook pages")
    const pagesData = await pagesRes.json()

    const pageWithIg = pagesData.data?.find((p: any) => p.instagram_business_account)
    if (!pageWithIg) {
      throw new Error("No Instagram Business account found. Connect a Facebook Page with Instagram first.")
    }

    const igAccountId = pageWithIg.instagram_business_account.id

    // Get Instagram profile
    const igRes = await fetch(
      `${FB_API_URL}/${igAccountId}?fields=id,username,name,profile_picture_url&access_token=${longLivedData.access_token}`
    )
    const igData = igRes.ok ? await igRes.json() : { id: igAccountId, username: igAccountId }

    return {
      providerAccountId: igAccountId,
      name: igData.name || igData.username || "Instagram",
      username: igData.username,
      picture: igData.profile_picture_url,
      accessToken: longLivedData.access_token,
      expiresIn: longLivedData.expires_in || 5184000, // ~60 days
    }
  }

  async refreshToken(_refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
  }> {
    throw new Error("Instagram uses long-lived tokens — re-authenticate when expired")
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    // Instagram requires a media URL to create a post
    // For text-only posts, we create a container with a caption
    // This requires an image URL — text-only is not supported by Instagram API

    if (!params.media?.length) {
      throw new Error("Instagram requires at least one image or video to publish")
    }

    // For now, we just create a caption-only post placeholder
    // Full implementation needs: 1) Upload media to hosting, 2) Create container, 3) Publish
    throw new Error("Instagram publishing requires media upload — coming soon")
  }
}

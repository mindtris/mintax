import config from "@/lib/core/config"
import { randomUUID } from "crypto"
import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, SocialProviderAnalytics, PublishParams } from "./types"

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
const LINKEDIN_API_URL = "https://api.linkedin.com/v2"

export class LinkedInProvider implements SocialProvider {
  identifier = "linkedin"
  name = "LinkedIn"
  category = "social" as const
  supportedContentTypes = ["post" as const, "article" as const]
  maxContentLength = 3000
  supportedMediaTypes = ["image" as const, "video" as const]
  maxMediaCount = 9
  requiresOAuth = true

  async generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl> {
    const clientId = config.social.linkedin.clientId
    if (!clientId) throw new Error("LinkedIn client ID not configured")

    const state = randomUUID()
    const scopes = ["openid", "profile", "w_member_social"]

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      state,
    })

    return {
      url: `${LINKEDIN_AUTH_URL}?${params.toString()}`,
      state,
    }
  }

  async authenticate(params: {
    code: string
    redirectUri: string
    codeVerifier?: string
  }): Promise<SocialProviderTokenResult> {
    const clientId = config.social.linkedin.clientId
    const clientSecret = config.social.linkedin.clientSecret
    if (!clientId || !clientSecret) throw new Error("LinkedIn credentials not configured")

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    })

    if (!tokenRes.ok) {
      throw new Error(`LinkedIn token exchange failed: ${await tokenRes.text()}`)
    }

    const tokenData = await tokenRes.json()

    // Fetch user profile
    const userRes = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) {
      throw new Error("Failed to fetch LinkedIn profile")
    }

    const userData = await userRes.json()

    return {
      providerAccountId: userData.sub,
      name: userData.name || `${userData.given_name} ${userData.family_name}`,
      username: userData.email || userData.sub,
      picture: userData.picture,
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
    const clientId = config.social.linkedin.clientId
    const clientSecret = config.social.linkedin.clientSecret
    if (!clientId || !clientSecret) throw new Error("LinkedIn credentials not configured")

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const res = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })

    if (!res.ok) {
      throw new Error(`LinkedIn token refresh failed: ${await res.text()}`)
    }

    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    // Get author URN
    const meRes = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${params.accessToken}` },
    })
    if (!meRes.ok) throw new Error("Failed to get LinkedIn user")
    const me = await meRes.json()
    const authorUrn = `urn:li:person:${me.sub}`

    const body = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: params.content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    const res = await fetch(`${LINKEDIN_API_URL}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`LinkedIn post failed: ${await res.text()}`)
    }

    const postId = res.headers.get("x-restli-id") || ""

    return {
      externalPostId: postId,
      externalUrl: `https://www.linkedin.com/feed/update/${postId}`,
    }
  }

  async runTool(params: { accessToken: string; tool: string; params?: any }): Promise<any> {
    if (params.tool === "organizations") {
      const res = await fetch(`${LINKEDIN_API_URL}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR`, {
        headers: { Authorization: `Bearer ${params.accessToken}` },
      })
      if (!res.ok) throw new Error("Failed to fetch organizations")
      const data = await res.json()
      // This is a simplified fetch, fully resolving names would require more API calls
      return data.elements?.map((e: any) => ({
        id: e.organizationalTarget,
        role: e.role,
      })) || []
    }
    throw new Error(`Tool ${params.tool} not supported by LinkedIn`)
  }
}

import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

const BSKY_API = "https://bsky.social/xrpc"

export class BlueskyProvider implements SocialProvider {
  identifier = "bluesky"
  name = "Bluesky"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = 300
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 4
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> {
    throw new Error("Bluesky uses app passwords, not OAuth")
  }

  /** For non-OAuth: code = app password, codeVerifier = handle/username */
  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const handle = params.codeVerifier || ""
    const appPassword = params.code
    if (!handle || !appPassword) throw new Error("Bluesky handle and app password are required")

    const res = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    })
    if (!res.ok) throw new Error(`Bluesky auth failed: ${await res.text()}`)
    const data = await res.json()

    return {
      providerAccountId: data.did,
      name: data.handle,
      username: data.handle,
      picture: data.avatar,
      accessToken: data.accessJwt,
      refreshToken: data.refreshJwt,
    }
  }

  async refreshToken(refreshToken: string) {
    const res = await fetch(`${BSKY_API}/com.atproto.server.refreshSession`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    })
    if (!res.ok) throw new Error(`Bluesky token refresh failed: ${await res.text()}`)
    const data = await res.json()
    return { accessToken: data.accessJwt, refreshToken: data.refreshJwt }
  }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const record = {
      $type: "app.bsky.feed.post",
      text: params.content,
      createdAt: new Date().toISOString(),
    }
    const res = await fetch(`${BSKY_API}/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ repo: params.settings?.did || "", collection: "app.bsky.feed.post", record }),
    })
    if (!res.ok) throw new Error(`Bluesky post failed: ${await res.text()}`)
    const data = await res.json()
    return { externalPostId: data.uri, externalUrl: `https://bsky.app/profile/${params.settings?.handle}/post/${data.uri.split("/").pop()}` }
  }
}

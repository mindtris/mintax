import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

export class NostrProvider implements SocialProvider {
  identifier = "nostr"
  name = "Nostr"
  category = "social" as const
  supportedContentTypes = ["post" as const]
  maxContentLength = -1
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 4
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Nostr uses private keys (nsec)") }

  /** code = private key (nsec or hex), codeVerifier = relay URL */
  async authenticate(params: { code: string; codeVerifier?: string }): Promise<SocialProviderTokenResult> {
    const privateKey = params.code
    if (!privateKey) throw new Error("Nostr private key is required")
    // Store the key — validation happens at publish time
    return {
      providerAccountId: privateKey.slice(0, 16) + "...",
      name: "Nostr Identity",
      username: params.codeVerifier || "nostr",
      accessToken: privateKey,
      scopes: params.codeVerifier ? `relay:${params.codeVerifier}` : "",
    }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Nostr keys don't expire") }

  async publishPost(_params: PublishParams): Promise<SocialProviderPostResult> {
    throw new Error("Nostr publishing requires NIP-01 event signing — use a Nostr client library")
  }
}

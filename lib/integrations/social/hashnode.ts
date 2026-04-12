import { SocialProvider, SocialProviderAuthUrl, SocialProviderTokenResult, SocialProviderPostResult, PublishParams } from "./types"

const HASHNODE_API = "https://gql.hashnode.com"

export class HashnodeProvider implements SocialProvider {
  identifier = "hashnode"
  name = "Hashnode"
  category = "blog" as const
  supportedContentTypes = ["article" as const]
  maxContentLength = -1
  supportedMediaTypes = ["image" as const]
  maxMediaCount = 50
  requiresOAuth = false

  async generateAuthUrl(): Promise<SocialProviderAuthUrl> { throw new Error("Hashnode uses personal access tokens") }

  async authenticate(params: { code: string }): Promise<SocialProviderTokenResult> {
    const token = params.code
    if (!token) throw new Error("Hashnode personal access token is required")
    const res = await fetch(HASHNODE_API, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ me { id username name profilePicture } }" }),
    })
    if (!res.ok) throw new Error(`Hashnode auth failed: ${await res.text()}`)
    const { data } = await res.json()
    if (!data?.me) throw new Error("Failed to fetch Hashnode user")
    return { providerAccountId: data.me.id, name: data.me.name || data.me.username, username: data.me.username, picture: data.me.profilePicture, accessToken: token }
  }

  async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> { throw new Error("Hashnode tokens don't expire") }

  async publishPost(params: PublishParams): Promise<SocialProviderPostResult> {
    const publicationId = params.settings?.publicationId
    if (!publicationId) throw new Error("Hashnode publication ID is required")
    const res = await fetch(HASHNODE_API, {
      method: "POST",
      headers: { Authorization: params.accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation PublishPost($input: PublishPostInput!) { publishPost(input: $input) { post { id url } } }`,
        variables: { input: { title: params.title || "", contentMarkdown: params.content, publicationId, tags: (params.tags || []).map(t => ({ name: t, slug: t.toLowerCase().replace(/\s+/g, "-") })) } },
      }),
    })
    if (!res.ok) throw new Error(`Hashnode post failed: ${await res.text()}`)
    const { data } = await res.json()
    return { externalPostId: data.publishPost.post.id, externalUrl: data.publishPost.post.url }
  }
}

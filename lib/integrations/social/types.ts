/**
 * Unified content publishing provider interface.
 * Supports social media (Twitter, LinkedIn), blogs (WordPress, Medium),
 * newsletters, and custom website publishing.
 */

export type ContentType = "post" | "article" | "newsletter" | "page" | "thread"

export interface SocialProviderAuthUrl {
  url: string
  state: string
  codeVerifier?: string
}

export interface SocialProviderTokenResult {
  providerAccountId: string
  name: string
  username: string
  picture?: string
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  scopes?: string
}

export interface SocialProviderPostResult {
  externalPostId: string
  externalUrl: string
}

export interface SocialProviderAnalytics {
  impressions: number
  engagements: number
  likes: number
  shares: number
  comments: number
  clicks: number
  reach: number
  extra?: Record<string, number>
}

export interface MediaAttachment {
  buffer: Buffer
  mimeType: string
  filename: string
  alt?: string
}

export interface PublishParams {
  accessToken: string
  content: string
  contentType: ContentType
  title?: string
  excerpt?: string
  slug?: string
  tags?: string[]
  media?: MediaAttachment[]
  settings?: Record<string, any>
}

export interface SocialProvider {
  /** Unique provider identifier */
  identifier: string

  /** Display name */
  name: string

  /** Category: social, blog, newsletter, custom */
  category: "social" | "blog" | "newsletter" | "custom"

  /** Supported content types this provider can publish */
  supportedContentTypes: ContentType[]

  /** Max content length (characters). -1 for unlimited */
  maxContentLength: number

  /** Supported media types */
  supportedMediaTypes: ("image" | "video" | "gif")[]

  /** Max number of media attachments per post */
  maxMediaCount: number

  /** Whether this provider requires OAuth (vs API key) */
  requiresOAuth: boolean

  /** Generate OAuth authorization URL */
  generateAuthUrl(redirectUri: string): Promise<SocialProviderAuthUrl>

  /** Exchange OAuth code for tokens */
  authenticate(params: {
    code: string
    redirectUri: string
    codeVerifier?: string
  }): Promise<SocialProviderTokenResult>

  /** Refresh expired access token */
  refreshToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
  }>

  /** Publish content to the platform */
  publishPost(params: PublishParams): Promise<SocialProviderPostResult>

  /** Delete published content (optional) */
  deletePost?(params: {
    accessToken: string
    externalPostId: string
  }): Promise<void>

  /** Fetch analytics for a published post (optional) */
  getPostAnalytics?(params: {
    accessToken: string
    externalPostId: string
  }): Promise<SocialProviderAnalytics>

  /** Run platform-specific tool (optional) */
  runTool?(params: {
    accessToken: string
    tool: string
    params?: any
  }): Promise<any>
}

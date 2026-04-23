import config from "@/lib/core/config"
import { getProvider } from "@/lib/integrations/social"
import { updateSocialAccountTokens } from "@/lib/services/social-accounts"
import { getDuePostsForPublishing, markError, markPublished, markPublishing } from "@/lib/services/social-posts"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (config.cron.secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${config.cron.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const duePosts = await getDuePostsForPublishing()

  let published = 0
  let failed = 0

  for (const post of duePosts) {
    try {
      // Non-social content (blog/doc/help/changelog) has no external account.
      // Flip straight to published at scheduledAt — no external publish call.
      if (!post.socialAccount) {
        await markPublished(post.id, null, null)
        published++
        continue
      }

      // Optimistic lock — set to publishing
      await markPublishing(post.id)

      const provider = getProvider(post.socialAccount.provider)

      // Check if token needs refresh
      let accessToken = post.socialAccount.accessToken
      if (
        post.socialAccount.tokenExpiresAt &&
        post.socialAccount.tokenExpiresAt < new Date() &&
        post.socialAccount.refreshToken
      ) {
        try {
          const refreshed = await provider.refreshToken(post.socialAccount.refreshToken)
          accessToken = refreshed.accessToken

          await updateSocialAccountTokens(post.socialAccount.id, post.organizationId, {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            tokenExpiresAt: refreshed.expiresIn
              ? new Date(Date.now() + refreshed.expiresIn * 1000)
              : undefined,
          })
        } catch (refreshErr: any) {
          await markError(post.id, `Token refresh failed: ${refreshErr.message}`)
          failed++
          continue
        }
      }

      // Publish
      const result = await provider.publishPost({
        accessToken,
        content: post.content,
        contentType: post.contentType as any,
        title: post.title || undefined,
        excerpt: post.excerpt || undefined,
        slug: post.slug || undefined,
        tags: post.tags,
        settings: post.settings as any,
      })

      await markPublished(post.id, result.externalPostId, result.externalUrl)
      published++
    } catch (err: any) {
      console.error(`Failed to publish post ${post.id}:`, err)
      await markError(post.id, err.message || "Publishing failed")
      failed++
    }
  }

  return NextResponse.json({
    processed: duePosts.length,
    published,
    failed,
    timestamp: new Date().toISOString(),
  })
}

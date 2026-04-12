import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import {
  createMultiPlatformPost,
  deleteSocialPost,
  getSocialPostById,
  getSocialPosts,
  markError,
  markPublished,
  markPublishing,
} from "@/lib/services/social-posts"
import { getProvider } from "@/lib/integrations/social"
import { updateSocialAccountTokens } from "@/lib/services/social-accounts"
import { NextRequest, NextResponse } from "next/server"

/** GET /api/v1/posts — List posts with optional filters */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const url = new URL(request.url)
    const status = url.searchParams.get("status") || undefined
    const provider = url.searchParams.get("provider") || undefined
    const contentType = url.searchParams.get("contentType") || undefined
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50") || 50, 200)
    const offset = parseInt(url.searchParams.get("offset") || "0") || 0

    const { items: posts, total } = await getSocialPosts(org.id, { status, provider, contentType }, { take: limit, skip: offset })

    return NextResponse.json({
      total,
      posts: posts.map((p) => ({
        id: p.id,
        group: p.group,
        contentType: p.contentType,
        content: p.content,
        title: p.title,
        excerpt: p.excerpt,
        slug: p.slug,
        tags: p.tags,
        status: p.status,
        scheduledAt: p.scheduledAt,
        publishedAt: p.publishedAt,
        externalPostId: p.externalPostId,
        externalUrl: p.externalUrl,
        error: p.error,
        provider: p.socialAccount.provider,
        accountName: p.socialAccount.name,
        createdAt: p.createdAt,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

/** POST /api/v1/posts — Create and optionally publish a post */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const body = await request.json()
    const { content, contentType, title, excerpt, slug, tags, accountIds, scheduledAt, publishNow } = body

    if (!content) return NextResponse.json({ error: "content required" }, { status: 400 })
    if (!accountIds?.length) return NextResponse.json({ error: "accountIds required" }, { status: 400 })

    const status = publishNow ? "queued" : scheduledAt ? "queued" : "draft"
    const schedule = publishNow ? new Date() : scheduledAt ? new Date(scheduledAt) : null

    const { group, posts } = await createMultiPlatformPost(
      org.id,
      user.id,
      { content, contentType, title, excerpt, slug, tags, status, scheduledAt: schedule },
      accountIds
    )

    // Immediate publish if requested
    if (publishNow) {
      for (const post of posts) {
        try {
          await markPublishing(post.id)
          const fullPost = await getSocialPostById(post.id, org.id)
          if (!fullPost?.socialAccount) continue

          const provider = getProvider(fullPost.socialAccount.provider)
          let accessToken = fullPost.socialAccount.accessToken

          if (
            fullPost.socialAccount.tokenExpiresAt &&
            fullPost.socialAccount.tokenExpiresAt < new Date() &&
            fullPost.socialAccount.refreshToken
          ) {
            const refreshed = await provider.refreshToken(fullPost.socialAccount.refreshToken)
            accessToken = refreshed.accessToken
            await updateSocialAccountTokens(fullPost.socialAccount.id, org.id, {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenExpiresAt: refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000) : undefined,
            })
          }

          const result = await provider.publishPost({
            accessToken,
            content: fullPost.content,
            contentType: fullPost.contentType as any,
            title: fullPost.title || undefined,
            tags: fullPost.tags,
            settings: fullPost.settings as any,
          })

          await markPublished(post.id, result.externalPostId, result.externalUrl)
        } catch (err: any) {
          await markError(post.id, err.message)
        }
      }
    }

    const finalPosts = await Promise.all(
      posts.map((p) => getSocialPostById(p.id, org.id))
    )

    return NextResponse.json({
      group,
      posts: finalPosts.map((p) => ({
        id: p?.id,
        status: p?.status,
        externalPostId: p?.externalPostId,
        externalUrl: p?.externalUrl,
        error: p?.error,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** DELETE /api/v1/posts?id=xxx — Delete a post */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    await deleteSocialPost(id, org.id)
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

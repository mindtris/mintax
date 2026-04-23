"use server"

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getProvider } from "@/lib/integrations/social"
import { updateSocialAccountTokens } from "@/lib/services/social-accounts"
import {
  createMultiPlatformPost,
  deleteSocialPost,
  getSocialPostById,
  markError,
  markPublished,
  markPublishing,
  updateSocialPost,
} from "@/lib/services/social-posts"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const CONTENT_TYPES = new Set(["blog", "doc", "help", "changelog"])

export async function createPostAction(_prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const content = formData.get("content") as string
  const contentType = (formData.get("contentType") as string) || "post"
  const title = formData.get("title") as string
  const excerpt = formData.get("excerpt") as string
  const slug = formData.get("slug") as string
  const tags = (formData.get("tags") as string)?.split(",").filter(Boolean) || []
  const accountIds = formData.getAll("accountIds") as string[]
  const scheduledAt = formData.get("scheduledAt") as string
  const action = formData.get("action") as string // "draft" | "schedule" | "publish_now"
  const isContentOnly = CONTENT_TYPES.has(contentType)

  const visibility = (formData.get("visibility") as string) || "internal"
  const canonicalPath = (formData.get("canonicalPath") as string) || null
  const seoTitle = (formData.get("seoTitle") as string) || null
  const seoDescription = (formData.get("seoDescription") as string) || null

  if (!content?.trim()) {
    return { error: "Content is required" }
  }

  if (!isContentOnly && !accountIds.length) {
    return { error: "Select at least one account" }
  }

  const status = action === "schedule" || action === "publish_now" ? "queued" : "draft"
  const schedule = action === "publish_now" ? new Date() : scheduledAt ? new Date(scheduledAt) : null

  const mediaUrls = formData.getAll("mediaUrls") as string[]
  const mediaIds = formData.getAll("mediaIds") as string[]

  const accountSettings: Record<string, any> = {}
  for (const id of accountIds) {
    const s = formData.get(`settings_${id}`) as string
    if (s) {
      try {
        accountSettings[id] = JSON.parse(s)
      } catch (e) {
        console.error(`Failed to parse settings for account ${id}:`, e)
      }
    }
  }

  const commentsStr = formData.get("comments") as string
  const comments = commentsStr ? JSON.parse(commentsStr) : []

  const { group, posts } = await createMultiPlatformPost(
    org.id,
    user.id,
    {
      content: content.trim(),
      contentType,
      title: title || undefined,
      excerpt: excerpt || undefined,
      slug: slug || undefined,
      tags,
      status,
      scheduledAt: schedule,
      mediaUrls,
      mediaIds,
      accountSettings,
      comments: isContentOnly ? [] : comments,
      visibility: isContentOnly ? visibility : undefined,
      canonicalPath: isContentOnly ? canonicalPath : undefined,
      seoTitle: isContentOnly ? seoTitle : undefined,
      seoDescription: isContentOnly ? seoDescription : undefined,
    },
    isContentOnly ? [] : accountIds
  )

  // If "publish now" on a social post, trigger immediate publishing.
  // Content-only posts have no external provider — the publish-posts cron
  // (or immediate save below for publish_now) flips status to published.
  if (action === "publish_now" && isContentOnly) {
    for (const post of posts) {
      await markPublished(post.id, null, null)
    }
  } else if (action === "publish_now") {
    for (const post of posts) {
      try {
        await markPublishing(post.id)

        const fullPost = await getSocialPostById(post.id, org.id)
        if (!fullPost?.socialAccount) continue

        const provider = getProvider(fullPost.socialAccount.provider)
        let accessToken = fullPost.socialAccount.accessToken

        // Refresh token if needed
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
            tokenExpiresAt: refreshed.expiresIn
              ? new Date(Date.now() + refreshed.expiresIn * 1000)
              : undefined,
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
        const errorMessage = err.message || "Publishing failed"
        await markError(post.id, errorMessage)
        console.error(`Post ${post.id} failed:`, errorMessage)
      }
    }
  }

  revalidatePath("/engage")
  revalidatePath("/engage/posts")
  
  if (action === "publish_now") {
     return { success: true, message: "Post published (or queued for background publishing)" }
  }
  
  return { success: true, message: action === "schedule" ? "Post scheduled" : "Post saved as draft" }
}

export async function updatePostAction(postId: string, _prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const content = formData.get("content") as string
  const title = formData.get("title") as string
  const scheduledAt = formData.get("scheduledAt") as string
  const status = formData.get("status") as string
  const visibility = formData.get("visibility") as string | null
  const canonicalPath = formData.get("canonicalPath") as string | null
  const seoTitle = formData.get("seoTitle") as string | null
  const seoDescription = formData.get("seoDescription") as string | null

  const heroImageId = formData.get("heroImageId") as string | null
  const trimmedContent = content?.trim()

  try {
    await updateSocialPost(postId, org.id, {
      content: trimmedContent && trimmedContent.length > 0 ? trimmedContent : undefined,
      title: title || undefined,
      status: status || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      visibility: visibility || undefined,
      canonicalPath: canonicalPath || undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      heroImageId: heroImageId || undefined,
    })
    revalidatePath("/engage/posts")
    revalidatePath(`/engage/posts/${postId}`)
    return { success: true as const }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save post" }
  }
}

export async function deletePostAction(postId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  await deleteSocialPost(postId, org.id)
  revalidatePath("/engage/posts")
}

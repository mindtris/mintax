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

  if (!content?.trim()) {
    return { error: "Content is required" }
  }

  if (!accountIds.length) {
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
      comments,
    },
    accountIds
  )

  // If "publish now", trigger immediate publishing
  if (action === "publish_now") {
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

  await updateSocialPost(postId, org.id, {
    content: content?.trim(),
    title: title || undefined,
    status,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  })

  revalidatePath("/engage/posts")
}

export async function deletePostAction(postId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  await deleteSocialPost(postId, org.id)
  revalidatePath("/engage/posts")
}

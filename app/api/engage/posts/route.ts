import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getActiveOrg } from "@/lib/core/auth"
import { prisma } from "@/lib/core/db"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    if (!org) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    const body = await req.json()
    const {
      contentType,
      title,
      content,
      excerpt,
      accountIds,
      scheduledAt,
      status,
      visibility,
      slug,
      seoTitle,
      seoDescription,
      heroImageId,
      tags,
      mediaUrls,
      mediaIds,
    } = body

    if (!contentType) {
      return NextResponse.json({ error: "Missing content type" }, { status: 400 })
    }

    // Default formatting
    let parsedScheduledAt = null
    if (scheduledAt) {
      parsedScheduledAt = new Date(scheduledAt)
    }

    // Insert record
    const post = await prisma.engagePost.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        type: contentType,
        status: status || "draft",
        visibility: visibility || "public",
        title,
        slug,
        content,
        excerpt,
        seoTitle,
        seoDescription,
        heroImageId,
        tags: tags || [],
        scheduledAt: parsedScheduledAt,
        publishedAt: status === "published" ? new Date() : null,
        mediaUrls: mediaUrls || [],
        mediaIds: mediaIds || [],
        accountIds: accountIds || [],
      },
    })

    return NextResponse.json({ success: true, post })

  } catch (error: any) {
    console.error("[engage/posts] Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to save post", details: error.message },
      { status: 500 }
    )
  }
}
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    if (!org) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    const body = await req.json()
    const {
      id,
      contentType,
      title,
      content,
      excerpt,
      accountIds,
      scheduledAt,
      status,
      visibility,
      slug,
      seoTitle,
      seoDescription,
      heroImageId,
      tags,
      mediaUrls,
      mediaIds,
    } = body

    if (!id) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 })
    }

    // Default formatting
    let parsedScheduledAt = null
    if (scheduledAt) {
      parsedScheduledAt = new Date(scheduledAt)
    }

    // Update record
    const post = await prisma.engagePost.update({
      where: { id, organizationId: org.id },
      data: {
        type: contentType,
        status: status || undefined,
        visibility: visibility || undefined,
        title,
        slug,
        content,
        excerpt,
        seoTitle,
        seoDescription,
        heroImageId,
        tags: tags || undefined,
        scheduledAt: parsedScheduledAt,
        publishedAt: status === "published" ? new Date() : undefined,
        mediaUrls: mediaUrls || undefined,
        mediaIds: mediaIds || undefined,
        accountIds: accountIds || undefined,
      },
    })

    return NextResponse.json({ success: true, post })

  } catch (error: any) {
    console.error("[engage/posts] Error updating post:", error)
    return NextResponse.json(
      { error: "Failed to update post", details: error.message },
      { status: 500 }
    )
  }
}

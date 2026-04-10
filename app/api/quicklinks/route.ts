import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { createQuicklink, getQuicklinks } from "@/lib/services/quicklinks"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const quicklinks = await getQuicklinks(org.id)
    return NextResponse.json(quicklinks)
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("GET Quicklinks error:", error)
    return NextResponse.json({ error: "Failed to fetch quicklinks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const body = await request.json()
    const { title, url, category } = body

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    const quicklink = await createQuicklink(org.id, { title, url, category })
    return NextResponse.json(quicklink, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("POST Quicklink error:", error)
    return NextResponse.json({ error: "Failed to create quicklink" }, { status: 500 })
  }
}

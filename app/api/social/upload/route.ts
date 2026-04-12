import { NextRequest, NextResponse } from "next/server"
import { uploadMedia } from "@/lib/services/social-media"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Basic validation
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
    }

    const result = await uploadMedia(file)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Social media upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}

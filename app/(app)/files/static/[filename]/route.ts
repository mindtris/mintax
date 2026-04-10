import { getCurrentUser } from "@/lib/core/auth"
import { fileExists, getStaticDirectory, safePathJoin } from "@/lib/files"
import { getStorage } from "@/lib/storage"
import lookup from "mime-types"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  const user = await getCurrentUser()

  if (!filename) {
    return new NextResponse("No filename provided", { status: 400 })
  }

  const staticFilesDirectory = getStaticDirectory(user)

  try {
    const storagePath = safePathJoin(staticFilesDirectory, filename)
    const isFileExists = await fileExists(storagePath)
    if (!isFileExists) {
      return new NextResponse(`File not found for user: ${filename}`, { status: 404 })
    }

    const fileBuffer = await getStorage().get(storagePath)

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": lookup.lookup(filename) || "application/octet-stream",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

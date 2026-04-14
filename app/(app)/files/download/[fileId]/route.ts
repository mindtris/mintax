import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { fileExists, fullPathForFile } from "@/lib/files"
import { encodeFilename } from "@/lib/utils"
import { getFileById } from "@/lib/services/files"
import { getStorage } from "@/lib/storage"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  if (!fileId) {
    return new NextResponse("No fileId provided", { status: 400 })
  }

  try {
    // Find file in database
    const file = await getFileById(fileId, org.id)

    if (!file) {
      return new NextResponse("File not found or does not belong to the organization", { status: 404 })
    }

    // Check if file exists
    const storagePath = fullPathForFile(file)
    const isFileExists = await fileExists(storagePath)
    if (!isFileExists) {
      return new NextResponse(`File not found on disk: ${file.path}`, { status: 404 })
    }

    // Read file from storage
    const fileBuffer = await getStorage().get(storagePath)

    // Return file with proper content type and encoded filename
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": file.mimetype,
          "Content-Disposition": `attachment; filename*=${encodeFilename(file.filename)}`,
        },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

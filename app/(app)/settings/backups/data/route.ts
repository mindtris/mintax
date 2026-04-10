import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getUserUploadsDirectory } from "@/lib/files"
import { MODEL_BACKUP, modelToJSON } from "@/lib/services/backups"
import { updateProgress } from "@/lib/services/progress"
import { getStorage } from "@/lib/storage"
import JSZip from "jszip"
import { NextResponse } from "next/server"

const MAX_FILE_SIZE = 64 * 1024 * 1024 // 64MB
const BACKUP_VERSION = "1.0"
const PROGRESS_UPDATE_INTERVAL_MS = 2000 // 2 seconds

export async function GET(request: Request) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const userUploadsDirectory = getUserUploadsDirectory(user)
  const url = new URL(request.url)
  const progressId = url.searchParams.get("progressId")
  const storage = getStorage()

  try {
    const zip = new JSZip()
    const rootFolder = zip.folder("data")
    if (!rootFolder) {
      console.error("Failed to create zip folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    // Add metadata with version information
    rootFolder.file(
      "metadata.json",
      JSON.stringify(
        {
          version: BACKUP_VERSION,
          timestamp: new Date().toISOString(),
          models: MODEL_BACKUP.map((m) => m.filename),
        },
        null,
        2
      )
    )

    // Backup models
    for (const backup of MODEL_BACKUP) {
      try {
        const jsonContent = await modelToJSON(org.id, backup)
        rootFolder.file(backup.filename, jsonContent)
      } catch (error) {
        console.error(`Error exporting table ${backup.filename}:`, error)
      }
    }

    const uploadsFolder = rootFolder.folder("uploads")
    if (!uploadsFolder) {
      console.error("Failed to create uploads folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    const uploadedFiles = await storage.listRecursive(userUploadsDirectory)

    // Update progress with total files if progressId is provided
    if (progressId) {
      await updateProgress(org.id, progressId, { total: uploadedFiles.length })
    }

    let processedFiles = 0
    let lastProgressUpdate = Date.now()

    for (const filePath of uploadedFiles) {
      try {
        // Check file size before reading
        const stats = await storage.stat(filePath)
        if (stats.size > MAX_FILE_SIZE) {
          console.warn(
            `Skipping large file ${filePath} (${Math.round(stats.size / 1024 / 1024)}MB > ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB limit)`
          )
          continue
        }

        const fileContent = await storage.get(filePath)
        // Store relative to user uploads directory
        const relativePath = filePath.startsWith(userUploadsDirectory)
          ? filePath.slice(userUploadsDirectory.length).replace(/^[/\\]/, "")
          : filePath
        uploadsFolder.file(relativePath, fileContent)

        processedFiles++

        // Update progress every PROGRESS_UPDATE_INTERVAL_MS milliseconds
        const now = Date.now()
        if (progressId && now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL_MS) {
          await updateProgress(org.id, progressId, { current: processedFiles })
          lastProgressUpdate = now
        }
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error)
      }
    }

    // Final progress update
    if (progressId) {
      await updateProgress(org.id, progressId, { current: uploadedFiles.length })
    }

    const archive = await zip.generateAsync({ type: "blob" })

    return new NextResponse(archive, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="mintax-backup.zip"`,
      },
    })
  } catch (error) {
    console.error("Error exporting database:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

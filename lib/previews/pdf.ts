"use server"

import { fileExists, getUserPreviewsDirectory, safePathJoin } from "@/lib/files"
import { getStorage } from "@/lib/storage"
import { User } from "@/lib/prisma/client"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { randomUUID } from "crypto"
import config from "@/lib/core/config"

export async function pdfToImages(user: User, origStoragePath: string): Promise<{ contentType: string; pages: string[] }> {
  const storage = getStorage()
  const userPreviewsDirectory = getUserPreviewsDirectory(user)

  const basename = path.basename(origStoragePath, path.extname(origStoragePath))

  // Check if converted pages already exist in storage
  const existingPages: string[] = []
  for (let i = 1; i <= config.upload.pdfs.maxPages; i++) {
    const convertedStoragePath = safePathJoin(userPreviewsDirectory, `${basename}.${i}.webp`)
    if (await fileExists(convertedStoragePath)) {
      existingPages.push(convertedStoragePath)
    } else {
      break
    }
  }

  if (existingPages.length > 0) {
    return { contentType: "image/webp", pages: existingPages }
  }

  // pdf2pic requires GraphicsMagick — gracefully degrade if unavailable (e.g., Vercel)
  let fromPath: any
  try {
    const pdf2pic = await import("pdf2pic")
    fromPath = pdf2pic.fromPath
  } catch {
    console.warn("pdf2pic unavailable (missing GraphicsMagick). PDF preview generation disabled.")
    return { contentType: "image/webp", pages: [] }
  }

  // pdf2pic requires local filesystem paths — download to temp, convert, upload results
  const { localPath: localPdfPath, cleanup: cleanupPdf } = await storage.getLocalPath(origStoragePath)
  const tempOutputDir = path.join(os.tmpdir(), `mintax-pdf-${randomUUID()}`)
  await fs.mkdir(tempOutputDir, { recursive: true })

  try {
    const pdf2picOptions = {
      density: config.upload.pdfs.dpi,
      saveFilename: basename,
      savePath: tempOutputDir,
      format: "webp" as const,
      quality: config.upload.pdfs.quality,
      width: config.upload.pdfs.maxWidth,
      height: config.upload.pdfs.maxHeight,
      preserveAspectRatio: true,
    }

    const convert = fromPath(localPdfPath, pdf2picOptions)
    const results = await convert.bulk(-1, { responseType: "image" })

    const storagePaths: string[] = []

    for (const result of results) {
      if (!result || !result.path) continue

      // Upload converted page to storage
      const pageFilename = path.basename(result.path)
      const pageStoragePath = safePathJoin(userPreviewsDirectory, pageFilename)
      const pageBuffer = await fs.readFile(result.path)
      await storage.put(pageStoragePath, pageBuffer)
      storagePaths.push(pageStoragePath)
    }

    return {
      contentType: "image/webp",
      pages: storagePaths,
    }
  } catch (error) {
    console.error("Error converting PDF to image:", error)
    // Return empty pages instead of throwing — allows the rest of the app to function
    return { contentType: "image/webp", pages: [] }
  } finally {
    await cleanupPdf()
    await fs.rm(tempOutputDir, { recursive: true, force: true }).catch(() => {})
  }
}

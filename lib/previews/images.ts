"use server"

import { fileExists, getOrgPreviewsDirectory, safePathJoin } from "@/lib/files"
import { getStorage } from "@/lib/storage"
import path from "path"
import sharp from "sharp"
import config from "@/lib/core/config"

export async function resizeImage(
  orgId: string,
  origStoragePath: string,
  maxWidth: number = config.upload.images.maxWidth,
  maxHeight: number = config.upload.images.maxHeight,
  quality: number = config.upload.images.quality
): Promise<{ contentType: string; resizedPath: string }> {
  try {
    const storage = getStorage()
    const orgPreviewsDirectory = getOrgPreviewsDirectory(orgId)

    const basename = path.basename(origStoragePath, path.extname(origStoragePath))
    const outputStoragePath = safePathJoin(orgPreviewsDirectory, `${basename}.webp`)

    if (await fileExists(outputStoragePath)) {
      // Read cached preview to get metadata
      const cachedBuffer = await storage.get(outputStoragePath)
      const metadata = await sharp(cachedBuffer).metadata()
      return {
        contentType: `image/${metadata.format}`,
        resizedPath: outputStoragePath,
      }
    }

    // Read original file from storage, resize in memory, write back
    const originalBuffer = await storage.get(origStoragePath)

    const resizedBuffer = await sharp(originalBuffer)
      .rotate()
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: quality })
      .toBuffer()

    await storage.put(outputStoragePath, resizedBuffer)

    return {
      contentType: "image/webp",
      resizedPath: outputStoragePath,
    }
  } catch (error) {
    console.error("Error resizing image:", error)
    return {
      contentType: "image/unknown",
      resizedPath: origStoragePath,
    }
  }
}

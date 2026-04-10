import { User } from "@/lib/prisma/client"
import path from "path"
import sharp from "sharp"
import config from "@/lib/core/config"
import { getStaticDirectory, isEnoughStorageToUploadFile, safePathJoin } from "./files"
import { getStorage } from "@/lib/storage"

export async function uploadStaticImage(
  user: User,
  file: File,
  saveFileName: string,
  maxWidth: number = config.upload.images.maxWidth,
  maxHeight: number = config.upload.images.maxHeight,
  quality: number = config.upload.images.quality
) {
  const storage = getStorage()
  const uploadDirectory = getStaticDirectory(user)

  if (!isEnoughStorageToUploadFile(user, file.size)) {
    throw Error("Not enough space to upload the file")
  }

  // Get target format from saveFileName extension
  const targetFormat = path.extname(saveFileName).slice(1).toLowerCase()
  if (!targetFormat) {
    throw Error("Target filename must have an extension")
  }

  // Convert image in memory and write via storage provider
  const storagePath = safePathJoin(uploadDirectory, saveFileName)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const sharpInstance = sharp(buffer).rotate().resize(maxWidth, maxHeight, {
    fit: "inside",
    withoutEnlargement: true,
  })

  let outputBuffer: Buffer
  switch (targetFormat) {
    case "png":
      outputBuffer = await sharpInstance.png().toBuffer()
      break
    case "jpg":
    case "jpeg":
      outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer()
      break
    case "webp":
      outputBuffer = await sharpInstance.webp({ quality }).toBuffer()
      break
    case "avif":
      outputBuffer = await sharpInstance.avif({ quality }).toBuffer()
      break
    default:
      throw Error(`Unsupported target format: ${targetFormat}`)
  }

  await storage.put(storagePath, outputBuffer)

  return storagePath
}

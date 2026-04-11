import path from "path"
import { LocalStorageProvider } from "./local"
import { S3StorageProvider } from "./s3"
import { VercelBlobStorageProvider } from "./vercel-blob"
import type { StorageProvider } from "./types"

export type { StorageProvider, FileStats, ListEntry } from "./types"

let _storage: StorageProvider | null = null

export function getStorage(): StorageProvider {
  if (_storage) return _storage

  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase()

  switch (provider) {
    case "s3": {
      const bucket = process.env.S3_BUCKET
      if (!bucket) throw new Error("S3_BUCKET is required when STORAGE_PROVIDER=s3")

      _storage = new S3StorageProvider({
        bucket,
        region: process.env.S3_REGION || "us-east-1",
        endpoint: process.env.S3_ENDPOINT || undefined,
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        prefix: process.env.S3_PREFIX || "",
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      })
      break
    }

    case "vercel-blob": {
      _storage = new VercelBlobStorageProvider(process.env.BLOB_PREFIX || "")
      break
    }
    case "local":
    default: {
      const uploadPath = path.resolve(process.env.UPLOAD_PATH || "./uploads")
      _storage = new LocalStorageProvider(uploadPath)
      break
    }
  }

  return _storage
}

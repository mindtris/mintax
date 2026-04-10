import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { randomUUID } from "crypto"
import type { FileStats, ListEntry, StorageProvider } from "./types"

export interface S3StorageConfig {
  bucket: string
  region: string
  endpoint?: string
  accessKeyId: string
  secretAccessKey: string
  /** Optional prefix for all keys, e.g. "uploads/" */
  prefix?: string
  /** Force path-style URLs (needed for MinIO, R2, etc.) */
  forcePathStyle?: boolean
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string
  private prefix: string

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket
    this.prefix = config.prefix ? config.prefix.replace(/\/$/, "") + "/" : ""

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle ?? true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  private key(filePath: string): string {
    // Normalize to forward slashes and remove leading slash
    const normalized = filePath.replace(/\\/g, "/").replace(/^\//, "")
    return this.prefix + normalized
  }

  async put(filePath: string, data: Buffer | Uint8Array): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(filePath),
        Body: data,
      })
    )
  }

  async get(filePath: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.key(filePath),
      })
    )
    const bytes = await response.Body!.transformToByteArray()
    return Buffer.from(bytes)
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.key(filePath),
        })
      )
      return true
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw error
    }
  }

  async stat(filePath: string): Promise<FileStats> {
    const response = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.key(filePath),
      })
    )
    return {
      size: response.ContentLength ?? 0,
      lastModified: response.LastModified ?? new Date(),
    }
  }

  async delete(filePath: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.key(filePath),
        })
      )
    } catch {
      // S3 DeleteObject is idempotent, but swallow any errors
    }
  }

  async move(fromPath: string, toPath: string): Promise<void> {
    // S3 doesn't have rename — copy then delete
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${this.key(fromPath)}`,
        Key: this.key(toPath),
      })
    )
    await this.delete(fromPath)
  }

  async list(directoryPath: string): Promise<ListEntry[]> {
    const prefix = this.key(directoryPath).replace(/\/$/, "") + "/"
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        Delimiter: "/",
      })
    )

    const entries: ListEntry[] = []

    // Files
    for (const obj of response.Contents ?? []) {
      if (!obj.Key || obj.Key === prefix) continue
      const relativePath = obj.Key.slice(this.prefix.length)
      entries.push({ path: relativePath, isDirectory: false })
    }

    // Directories (common prefixes)
    for (const cp of response.CommonPrefixes ?? []) {
      if (!cp.Prefix) continue
      const relativePath = cp.Prefix.slice(this.prefix.length).replace(/\/$/, "")
      entries.push({ path: relativePath, isDirectory: true })
    }

    return entries
  }

  async listRecursive(directoryPath: string): Promise<string[]> {
    const results: string[] = []
    const prefix = this.key(directoryPath).replace(/\/$/, "") + "/"
    let continuationToken: string | undefined

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      )

      for (const obj of response.Contents ?? []) {
        if (!obj.Key || obj.Key === prefix) continue
        results.push(obj.Key.slice(this.prefix.length))
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
    } while (continuationToken)

    return results
  }

  async deleteDirectory(directoryPath: string): Promise<void> {
    const files = await this.listRecursive(directoryPath)
    if (files.length === 0) return

    // Delete in batches of 1000 (S3 limit)
    for (let i = 0; i < files.length; i += 1000) {
      const batch = files.slice(i, i + 1000)
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: batch.map((f) => ({ Key: this.key(f) })),
            Quiet: true,
          },
        })
      )
    }
  }

  async getDirectorySize(directoryPath: string): Promise<number> {
    let totalSize = 0
    const prefix = this.key(directoryPath).replace(/\/$/, "") + "/"
    let continuationToken: string | undefined

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      )

      for (const obj of response.Contents ?? []) {
        totalSize += obj.Size ?? 0
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
    } while (continuationToken)

    return totalSize
  }

  async getLocalPath(filePath: string): Promise<{ localPath: string; cleanup: () => Promise<void> }> {
    const data = await this.get(filePath)
    const ext = path.extname(filePath)
    const tempPath = path.join(os.tmpdir(), `mintax-${randomUUID()}${ext}`)
    await fs.writeFile(tempPath, data)
    return {
      localPath: tempPath,
      cleanup: async () => {
        try {
          await fs.unlink(tempPath)
        } catch {
          // ignore cleanup errors
        }
      },
    }
  }

  async putFromLocalPath(localPath: string, storagePath: string): Promise<void> {
    const data = await fs.readFile(localPath)
    await this.put(storagePath, data)
  }
}

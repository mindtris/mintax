import { put, del, list, head } from "@vercel/blob"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { randomUUID } from "crypto"
import type { FileStats, ListEntry, StorageProvider } from "./types"

export class VercelBlobStorageProvider implements StorageProvider {
  private prefix: string

  constructor(prefix: string = "") {
    this.prefix = prefix ? prefix.replace(/\/$/, "") + "/" : ""
  }

  private key(filePath: string): string {
    const normalized = filePath.replace(/\\/g, "/").replace(/^\//, "")
    return this.prefix + normalized
  }

  /** Finds a blob's URL by its exact pathname */
  private async getUrl(filePath: string): Promise<string | null> {
    const pathname = this.key(filePath)
    const { blobs } = await list({
      prefix: pathname,
      limit: 1,
    })
    
    // Exact match check to avoid partial matches
    const blob = blobs.find(b => b.pathname === pathname)
    return blob?.url || null
  }

  async put(filePath: string, data: Buffer | Uint8Array): Promise<void> {
    // Convert to Buffer and use 'any' to bypass strict type check for PutBody, 
    // ensuring compatibility with various Node/Next.js environments.
    const body = Buffer.isBuffer(data) ? data : Buffer.from(data)
    await put(this.key(filePath), body as any, {
      access: "public",
      addRandomSuffix: false, // Ensures predictable pathnames
    })
  }

  async get(filePath: string): Promise<Buffer> {
    const url = await this.getUrl(filePath)
    if (!url) throw new Error(`File not found: ${filePath}`)
    
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`)
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async exists(filePath: string): Promise<boolean> {
    const url = await this.getUrl(filePath)
    if (!url) return false
    try {
      await head(url)
      return true
    } catch {
      return false
    }
  }

  async stat(filePath: string): Promise<FileStats> {
    const url = await this.getUrl(filePath)
    if (!url) throw new Error(`File not found: ${filePath}`)
    
    const blob = await head(url)
    return {
      size: blob.size,
      lastModified: blob.uploadedAt,
    }
  }

  async delete(filePath: string): Promise<void> {
    const url = await this.getUrl(filePath)
    if (url) {
      await del(url)
    }
  }

  async move(fromPath: string, toPath: string): Promise<void> {
    const data = await this.get(fromPath)
    await this.put(toPath, data)
    await this.delete(fromPath)
  }

  async list(directoryPath: string): Promise<ListEntry[]> {
    const prefix = this.key(directoryPath).replace(/\/$/, "") + "/"
    const { blobs, folders } = await list({
      prefix,
      mode: "folded", // This gives us a directory-like view
    })

    const entries: ListEntry[] = []

    // Blobs (Files)
    for (const blob of blobs) {
      const relativePath = blob.pathname.slice(this.prefix.length)
      entries.push({ path: relativePath, isDirectory: false })
    }

    // Folders (Common Prefixes)
    for (const folder of folders || []) {
      const relativePath = folder.slice(this.prefix.length).replace(/\/$/, "")
      entries.push({ path: relativePath, isDirectory: true })
    }

    return entries
  }

  async listRecursive(directoryPath: string): Promise<string[]> {
    const prefix = this.key(directoryPath).replace(/\/$/, "") + "/"
    let results: string[] = []
    let cursor: string | undefined

    do {
      const response = await list({
        prefix,
        cursor,
      })
      results.push(...response.blobs.map(b => b.pathname.slice(this.prefix.length)))
      cursor = response.cursor
    } while (cursor)

    return results
  }

  async deleteDirectory(directoryPath: string): Promise<void> {
    const prefix = this.key(directoryPath).replace(/\/$/, "") + "/"
    const { blobs } = await list({ prefix })
    if (blobs.length > 0) {
      await del(blobs.map(b => b.url))
    }
  }

  async getDirectorySize(directoryPath: string): Promise<number> {
    const prefix = this.key(directoryPath).replace(/\/$/, "") + "/"
    let totalSize = 0
    let cursor: string | undefined

    do {
      const response = await list({
        prefix,
        cursor,
      })
      totalSize += response.blobs.reduce((sum, b) => sum + b.size, 0)
      cursor = response.cursor
    } while (cursor)

    return totalSize
  }

  async getLocalPath(filePath: string): Promise<{ localPath: string; cleanup: () => Promise<void> }> {
    const data = await this.get(filePath)
    const ext = path.extname(filePath)
    const tempPath = path.join(os.tmpdir(), `mintax-blob-${randomUUID()}${ext}`)
    await fs.writeFile(tempPath, data)
    
    return {
      localPath: tempPath,
      cleanup: async () => {
        try {
          await fs.unlink(tempPath)
        } catch {
          // ignore
        }
      },
    }
  }

  async putFromLocalPath(localPath: string, storagePath: string): Promise<void> {
    const data = await fs.readFile(localPath)
    await this.put(storagePath, data)
  }
}

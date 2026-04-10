import fs from "fs/promises"
import path from "path"
import type { FileStats, ListEntry, StorageProvider } from "./types"

export class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string) {}

  private resolve(filePath: string): string {
    const resolved = path.resolve(this.basePath, filePath)
    if (!resolved.startsWith(path.resolve(this.basePath))) {
      throw new Error("Path traversal detected")
    }
    return resolved
  }

  async put(filePath: string, data: Buffer | Uint8Array): Promise<void> {
    const fullPath = this.resolve(filePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, data)
  }

  async get(filePath: string): Promise<Buffer> {
    return fs.readFile(this.resolve(filePath))
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(filePath))
      return true
    } catch {
      return false
    }
  }

  async stat(filePath: string): Promise<FileStats> {
    const stats = await fs.stat(this.resolve(filePath))
    return { size: stats.size, lastModified: stats.mtime }
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(filePath))
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error
    }
  }

  async move(fromPath: string, toPath: string): Promise<void> {
    const resolvedFrom = this.resolve(fromPath)
    const resolvedTo = this.resolve(toPath)
    await fs.mkdir(path.dirname(resolvedTo), { recursive: true })
    await fs.rename(resolvedFrom, resolvedTo)
  }

  async list(directoryPath: string): Promise<ListEntry[]> {
    const fullPath = this.resolve(directoryPath)
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true })
      return entries.map((entry) => ({
        path: path.join(directoryPath, entry.name),
        isDirectory: entry.isDirectory(),
      }))
    } catch (error: any) {
      if (error.code === "ENOENT") return []
      throw error
    }
  }

  async listRecursive(directoryPath: string): Promise<string[]> {
    const results: string[] = []

    const walk = async (dir: string) => {
      const fullPath = this.resolve(dir)
      try {
        const entries = await fs.readdir(fullPath, { withFileTypes: true })
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            await walk(entryPath)
          } else {
            results.push(entryPath)
          }
        }
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error
      }
    }

    await walk(directoryPath)
    return results
  }

  async deleteDirectory(directoryPath: string): Promise<void> {
    try {
      await fs.rm(this.resolve(directoryPath), { recursive: true, force: true })
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error
    }
  }

  async getDirectorySize(directoryPath: string): Promise<number> {
    let totalSize = 0

    const walk = async (dir: string) => {
      const fullPath = this.resolve(dir)
      try {
        const entries = await fs.readdir(fullPath, { withFileTypes: true })
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            await walk(entryPath)
          } else {
            const stats = await fs.stat(this.resolve(entryPath))
            totalSize += stats.size
          }
        }
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error
      }
    }

    await walk(directoryPath)
    return totalSize
  }

  async getLocalPath(filePath: string): Promise<{ localPath: string; cleanup: () => Promise<void> }> {
    return {
      localPath: this.resolve(filePath),
      cleanup: async () => {}, // no-op for local storage
    }
  }

  async putFromLocalPath(localPath: string, storagePath: string): Promise<void> {
    const resolved = this.resolve(storagePath)
    // If the file is already at the correct location, skip
    if (path.resolve(localPath) === resolved) return
    await fs.mkdir(path.dirname(resolved), { recursive: true })
    await fs.copyFile(localPath, resolved)
  }
}

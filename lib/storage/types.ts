export interface FileStats {
  size: number
  lastModified: Date
}

export interface ListEntry {
  path: string
  isDirectory: boolean
}

/**
 * Storage provider interface — abstracts local filesystem vs S3-compatible storage.
 * All paths are relative to the storage root (e.g. "user@email.com/unsorted/abc.pdf").
 */
export interface StorageProvider {
  /** Write a file. Creates parent directories/prefixes as needed. */
  put(filePath: string, data: Buffer | Uint8Array): Promise<void>

  /** Read a file into a Buffer. Throws if not found. */
  get(filePath: string): Promise<Buffer>

  /** Check if a file exists. */
  exists(filePath: string): Promise<boolean>

  /** Get file metadata (size, lastModified). Throws if not found. */
  stat(filePath: string): Promise<FileStats>

  /** Delete a single file. No-op if not found. */
  delete(filePath: string): Promise<void>

  /** Move/rename a file. For S3 this is copy + delete. */
  move(fromPath: string, toPath: string): Promise<void>

  /** List entries in a directory/prefix. Non-recursive by default. */
  list(directoryPath: string): Promise<ListEntry[]>

  /** Recursively list all file paths under a prefix. */
  listRecursive(directoryPath: string): Promise<string[]>

  /** Delete a directory/prefix and everything under it. */
  deleteDirectory(directoryPath: string): Promise<void>

  /** Calculate total size of all files under a prefix. */
  getDirectorySize(directoryPath: string): Promise<number>

  /**
   * Get an absolute local file path for tools that need direct disk access
   * (sharp, pdf2pic). For local storage this returns the real path. For S3
   * this downloads to a temp file and returns that path. Caller must call
   * the returned cleanup function when done.
   */
  getLocalPath(filePath: string): Promise<{ localPath: string; cleanup: () => Promise<void> }>

  /**
   * Write a file from a local path back to storage. Used after sharp/pdf2pic
   * write to a local temp path. For local storage this is a no-op if the path
   * is already correct; for S3 this uploads the file.
   */
  putFromLocalPath(localPath: string, storagePath: string): Promise<void>
}

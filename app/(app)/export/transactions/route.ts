import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { fileExists, fullPathForFile } from "@/lib/files"
import { EXPORT_AND_IMPORT_FIELD_MAP, ExportFields, ExportFilters } from "@/lib/services/export_and_import"
import { getFields } from "@/lib/services/fields"
import { updateProgress } from "@/lib/services/progress"
import { buildTransactionsWhere } from "@/lib/services/transactions"
import { getStorage } from "@/lib/storage"
import { prisma } from "@/lib/core/db"
import { format } from "@fast-csv/format"
import { formatDate } from "date-fns"
import JSZip from "jszip"
import { NextResponse } from "next/server"
import path from "path"
import { Readable } from "stream"

const TRANSACTIONS_CHUNK_SIZE = 300
const FILES_CHUNK_SIZE = 50
const PROGRESS_UPDATE_INTERVAL_MS = 2000 // 2 seconds

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filters = Object.fromEntries(url.searchParams.entries()) as ExportFilters
  const fields = (url.searchParams.get("fields")?.split(",") ?? []) as ExportFields
  const includeAttachments = url.searchParams.get("includeAttachments") === "true"
  const progressId = url.searchParams.get("progressId")

  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const { where, orderBy } = buildTransactionsWhere(org.id, filters)
  const totalTransactions = await prisma.transaction.count({ where })
  const existingFields = await getFields(org.id)
  const storage = getStorage()

  try {
    const fieldKeys = fields.filter((field) => existingFields.some((f) => f.code === field))

    // Create a transform stream for CSV generation
    const csvStream = format({ headers: fieldKeys, writeBOM: true, writeHeaders: false })

    // Custom CSV headers
    const headers = fieldKeys.map((field) => existingFields.find((f) => f.code === field)?.name ?? "UNKNOWN")
    csvStream.write(headers)

    // Process transactions in chunks to avoid memory issues
    for (let skip = 0; skip < totalTransactions; skip += TRANSACTIONS_CHUNK_SIZE) {
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy,
        take: TRANSACTIONS_CHUNK_SIZE,
        skip,
      })

      for (const transaction of transactions) {
        const row: Record<string, unknown> = {}
        for (const field of existingFields) {
          let value
          if (field.isExtra) {
            value = (transaction.extra as any)?.[field.code] ?? ""
          } else {
            value = (transaction as any)[field.code] ?? ""
          }

          const exportFieldSettings = EXPORT_AND_IMPORT_FIELD_MAP[field.code]
          if (exportFieldSettings && exportFieldSettings.export) {
            row[field.code] = await exportFieldSettings.export(org.id, value)
          } else {
            row[field.code] = value
          }
        }
        csvStream.write(row)
      }
    }
    csvStream.end()

    if (!includeAttachments) {
      const stream = Readable.from(csvStream)
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transactions.csv"`,
        },
      })
    }

    // For ZIP files, we'll use a more memory-efficient approach
    const zip = new JSZip()

    // Add CSV to zip
    const csvContent = await new Promise<string>((resolve) => {
      let content = ""
      csvStream.on("data", (chunk) => {
        content += chunk
      })
      csvStream.on("end", () => resolve(content))
    })
    zip.file("transactions.csv", csvContent)

    // Process files in chunks
    const filesFolder = zip.folder("files")
    if (!filesFolder) {
      throw new Error("Failed to create zip folder")
    }

    let totalFilesProcessed = 0
    let totalFilesToProcess = 0
    let lastProgressUpdate = Date.now()

    // First count total files to process using a more efficient way
    for (let skip = 0; skip < totalTransactions; skip += TRANSACTIONS_CHUNK_SIZE) {
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy,
        take: TRANSACTIONS_CHUNK_SIZE,
        skip,
        select: { files: true }
      })
      for (const t of transactions) {
        totalFilesToProcess += (t.files as string[])?.length || 0
      }
    }

    // Update progress with total files if progressId is provided
    if (progressId) {
      await updateProgress(org.id, progressId, { total: totalFilesToProcess })
    }

    for (let skip = 0; skip < totalTransactions; skip += FILES_CHUNK_SIZE) {
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy,
        take: FILES_CHUNK_SIZE,
        skip,
      })

      for (const transaction of transactions) {
        const fileIds = transaction.files as string[]
        if (!fileIds?.length) continue

        const transactionFiles = await prisma.file.findMany({
          where: { id: { in: fileIds }, organizationId: org.id },
          orderBy: { createdAt: "asc" }
        })

        const transactionFolder = filesFolder.folder(
          path.join(
            transaction.issuedAt ? formatDate(transaction.issuedAt, "yyyy/MM") : "",
            transactionFiles.length > 1 ? transaction.name || transaction.id : ""
          )
        )

        if (!transactionFolder) continue

        for (const file of transactionFiles) {
          const storagePath = fullPathForFile(file)
          if (await fileExists(storagePath)) {
            const fileData = await storage.get(storagePath)
            const fileExtension = path.extname(file.path)
            transactionFolder.file(
              `${formatDate(transaction.issuedAt || new Date(), "yyyy-MM-dd")} - ${
                transaction.name || transaction.id
              }${fileExtension}`,
              fileData
            )

            totalFilesProcessed++

            // Update progress every PROGRESS_UPDATE_INTERVAL_MS milliseconds
            const now = Date.now()
            if (progressId && now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL_MS) {
              await updateProgress(org.id, progressId, { current: totalFilesProcessed })
              lastProgressUpdate = now
            }
          }
        }
      }
    }

    // Final progress update
    if (progressId) {
      await updateProgress(org.id, progressId, { current: totalFilesToProcess })
    }

    // Generate zip with progress tracking
    const zipContent = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    })

    return new NextResponse(zipContent as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="transactions.zip"`,
      },
    })
  } catch (error) {
    console.error("Error exporting transactions:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

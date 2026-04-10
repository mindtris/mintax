"use client"

import { useNotification } from "@/app/(app)/context"
import { uploadFilesAction } from "@/app/(app)/files/actions"
import { FormError } from "@/components/forms/error"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import config from "@/lib/core/config"
import { File as FileType } from "@/lib/prisma/client"
import {
  Camera,
  FilePlus,
  FileSpreadsheet,
  Loader2,
  Plus,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { startTransition, useState } from "react"

interface QuickActionsWidgetProps {
  files: FileType[]
  orgName: string
}

export function QuickActionsWidget({ files, orgName }: QuickActionsWidgetProps) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    setUploadError("")
    if (e.target.files && e.target.files.length > 0) {
      const formData = new FormData()
      for (let i = 0; i < e.target.files.length; i++) {
        formData.append("files", e.target.files[i])
      }
      startTransition(async () => {
        const result = await uploadFilesAction(formData)
        if (result.success) {
          showNotification({ code: "sidebar.unsorted", message: "new" })
          setTimeout(() => showNotification({ code: "sidebar.unsorted", message: "" }), 3000)
          router.push("/unsorted")
        } else {
          setUploadError(result.error ? result.error : "Something went wrong...")
        }
        setIsUploading(false)
      })
    }
  }

  return (
    <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden h-full flex flex-col">
      <CardHeader className="px-6 py-4 border-b border-black/[0.03]">
        <CardTitle className="text-sm font-medium">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Action links */}
        <div className="flex flex-col divide-y divide-black/[0.03]">
          <Link
            href="/transactions?new=true"
            className="flex items-center gap-3 px-6 py-4 hover:bg-black/[0.02] transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Add transaction</p>
              <p className="text-xs text-[#141413]">Record income or expense</p>
            </div>
          </Link>

          <Link
            href="/invoices/new?type=bill"
            className="flex items-center gap-3 px-6 py-4 hover:bg-black/[0.02] transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Add bill</p>
              <p className="text-xs text-[#141413]">Record a payable bill</p>
            </div>
          </Link>

          <Link
            href="/import/csv"
            className="flex items-center gap-3 px-6 py-4 hover:bg-black/[0.02] transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Import bank statement</p>
              <p className="text-xs text-[#141413]">CSV or supported formats</p>
            </div>
          </Link>
        </div>

        {/* Unsorted files */}
        {files.length > 0 && (
          <div className="border-t border-black/[0.03] px-6 py-4">
            <Link href="/unsorted" className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#141413]">Unsorted files</span>
              <span className="text-xs text-primary">{files.length} to review</span>
            </Link>
            <div className="flex flex-col gap-1.5">
              {files.slice(0, 3).map((file) => (
                <Link
                  href={`/unsorted/#${file.id}`}
                  key={file.id}
                  className="flex items-center gap-2 rounded-md p-2 hover:bg-black/[0.02] transition-colors"
                >
                  <FilePlus className="h-4 w-4 text-[#141413] shrink-0" />
                  <span className="truncate text-xs">{file.filename}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upload drop zone */}
        <div className="mt-auto border-t border-black/[0.03] p-4">
          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-black/[0.08] rounded-xl p-6 cursor-pointer hover:border-primary/30 transition-colors">
            <input
              type="file"
              className="hidden"
              multiple
              accept={config.upload.acceptedMimeTypes}
              onChange={handleFileChange}
            />
            {isUploading ? (
              <Loader2 className="h-5 w-5 text-[#141413] animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-[#141413]" />
            )}
            <p className="text-xs text-[#141413] text-center">
              {isUploading ? "Uploading..." : "Drop receipts, invoices or statements"}
            </p>
            {uploadError && <FormError>{uploadError}</FormError>}
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

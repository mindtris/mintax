"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, Loader2, Plus, ScanLine } from "lucide-react"
import { useRef, useState, startTransition } from "react"
import config from "@/lib/core/config"
import { uploadFilesAction } from "@/app/(app)/files/actions"
import { useNotification } from "@/app/(app)/context"
import { useRouter } from "next/navigation"

interface AddTransactionMenuProps {
  onAddTransaction: () => void
}

export function AddTransactionMenu({ onAddTransaction }: AddTransactionMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { showNotification } = useNotification()
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
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
        }
        setIsUploading(false)
      })
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept={config.upload.acceptedMimeTypes}
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="hidden md:block">{isUploading ? "Uploading..." : "Add"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onAddTransaction}>
            <FileText className="h-4 w-4" />
            Add transaction
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <ScanLine className="h-4 w-4" />
            Analyze document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

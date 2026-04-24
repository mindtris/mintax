"use client"

import { useState, useCallback } from "react"
import { ImageIcon, X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CoverImagePickerProps {
  value?: string | null       // URL of currently selected image
  heroImageId?: string | null // file ID
  onChange: (url: string, fileId: string) => void
  onRemove: () => void
  variant?: "default" | "ghost"
  className?: string
}

export function CoverImagePicker({ value, heroImageId, onChange, onRemove, variant = "default", className }: CoverImagePickerProps) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed for the cover photo.")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/social/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      onChange(data.url, data.id)
    } catch {
      toast.error("Cover image upload failed")
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (value) {
    return (
      <div className={cn("relative w-full h-64 rounded-md overflow-hidden border bg-muted group", className)}>
        <img src={value} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
        <label className="absolute bottom-4 right-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <span className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-sm px-4 py-2 rounded-md transition-colors">
            <Upload className="h-4 w-4" />
            Replace
          </span>
        </label>
      </div>
    )
  }

  if (variant === "ghost") {
    return (
      <label className={cn("inline-flex items-center cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group", className)}>
        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {uploading ? (
          <div className="h-4 w-4 mr-2 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4 mr-2 opacity-50 group-hover:opacity-100 transition-opacity" />
        )}
        Add cover image
      </label>
    )
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center w-full h-40 rounded-md border-2 border-dashed cursor-pointer transition-all",
        dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border",
        className
      )}
    >
      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
          <span className="text-xs">Uploading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageIcon className="h-6 w-6 opacity-50" />
          <div className="text-center">
            <p className="text-xs font-medium">Add cover image</p>
            <p className="text-[10px] opacity-60 mt-0.5">Drag & drop or click to upload</p>
          </div>
        </div>
      )}
    </label>
  )
}

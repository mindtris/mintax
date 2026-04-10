"use client"

import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

export function CSVImportButton({ accountId }: { accountId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/bank-accounts/${accountId}/import`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setResult(`Imported ${data.entriesImported} entries`)
        router.refresh()
      } else {
        setResult(data.error || "Import failed")
      }
    } catch {
      setResult("Import failed")
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleUpload}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {loading ? "Importing..." : "Import CSV"}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground animate-in fade-in">{result}</span>
      )}
    </div>
  )
}

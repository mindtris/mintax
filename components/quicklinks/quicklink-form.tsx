"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { toast } from "sonner"

import { createQuicklinkAction, updateQuicklinkAction } from "@/app/(app)/people/actions"

interface QuicklinkFormProps {
  initialData?: {
    id: string
    title: string
    url: string
    category: string
  }
  categories: { id: string; name: string }[]
  onSuccess: () => void
  onCancel: () => void
}

export function QuicklinkForm({ initialData, categories = [], onSuccess, onCancel }: QuicklinkFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category || "")
  const [manualCategory, setManualCategory] = useState<string>("")
  const [isManual, setIsManual] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const url = formData.get("url") as string
    const category = isManual ? manualCategory : selectedCategory

    if (!category) {
      toast.error("Please select or enter a category")
      setLoading(false)
      return
    }

    try {
      const payload = { title, url, category }
      const res = initialData 
        ? await updateQuicklinkAction(initialData.id, payload)
        : await createQuicklinkAction(payload)

      if (!res.success) {
        throw new Error(res.error || `Failed to ${initialData ? "update" : "create"} quicklink`)
      }

      toast.success(`Quicklink ${initialData ? "updated" : "created"}`)
      setLoading(false)
      onSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "An error occurred")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              name="title" 
              required 
              defaultValue={initialData?.title} 
              placeholder="e.g. Employee HR Portal" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input 
              id="url" 
              name="url" 
              type="url" 
              required 
              defaultValue={initialData?.url} 
              placeholder="https://..." 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={isManual ? "manual" : selectedCategory} 
              onValueChange={(val) => {
                if (val === "manual") {
                  setIsManual(true)
                } else {
                  setIsManual(false)
                  setSelectedCategory(val)
                }
              }}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
                <SelectItem value="manual" className="font-medium text-orange-600 focus:text-orange-600">
                  + Enter manually...
                </SelectItem>
              </SelectContent>
            </Select>
            
            {isManual && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                <Input 
                  placeholder="Enter new category name" 
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  required={isManual}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-6 mt-auto border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Save link"}
        </Button>
      </div>
    </form>
  )
}

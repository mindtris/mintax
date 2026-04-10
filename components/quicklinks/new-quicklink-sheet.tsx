"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { toast } from "sonner"

export function NewQuicklinkSheet({ categories = [] }: { categories?: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
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
      const res = await fetch("/api/quicklinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url, category }),
      })

      if (!res.ok) {
        throw new Error("Failed to create quicklink")
      }

      toast.success("Quicklink created")
      setLoading(false)
      setOpen(false)
      
      // Refresh the page data
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error("An error occurred")
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Link
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle>New Quicklink</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="e.g. Employee HR Portal" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" name="url" type="url" required placeholder="https://..." />
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

          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Link"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Image as ImageIcon } from "lucide-react"

export interface CommentData {
  content: string
  delayMinutes: number
  mediaUrls: string[]
}

export function CommentEditor({
  index,
  data,
  onChange,
  onDelete,
}: {
  index: number
  data: CommentData
  onChange: (data: CommentData) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/10 relative">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase">Thread / Comment #{index + 1}</Label>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        <Textarea 
          placeholder="Write your first comment / next thread item..."
          value={data.content}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <Label className="text-[10px]">Delay (minutes)</Label>
          <Input 
            type="number" 
            min={0}
            className="h-8 text-xs" 
            value={data.delayMinutes}
            onChange={(e) => onChange({ ...data, delayMinutes: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-[10px]">Media</Label>
          <Button type="button" variant="outline" size="sm" className="h-8 w-full gap-2 text-[10px]" disabled>
            <ImageIcon className="h-3 w-3" /> Add Media
          </Button>
        </div>
      </div>
    </div>
  )
}

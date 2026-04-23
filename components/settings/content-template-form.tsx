"use client"

import { 
  addContentTemplateAction, 
  editContentTemplateAction, 
  deleteContentTemplateAction 
} from "@/app/(app)/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Trash2, CheckCircle2, X, Plus } from "lucide-react"

interface ContentTemplate {
  id?: string
  name: string
  content: string
  category?: string
  platforms: string[]
}

interface Props {
  template?: ContentTemplate
  onSuccess?: () => void
}

export default function ContentTemplateForm({ template, onSuccess }: Props) {
  const isEditing = !!template?.id
  const [platforms, setPlatforms] = useState<string[]>(template?.platforms || [])
  const [newPlatform, setNewPlatform] = useState("")

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const data = {
        name: formData.get("name") as string,
        content: formData.get("content") as string,
        category: formData.get("category") as string,
        platforms,
      }

      if (isEditing) {
        return await editContentTemplateAction(template.id!, data)
      } else {
        return await addContentTemplateAction(data)
      }
    },
    null
  )

  useEffect(() => {
    if (state?.success) {
      toast.success(isEditing ? "Template updated" : "Template created")
      onSuccess?.()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, isEditing, onSuccess])

  const handleDelete = async () => {
    if (!isEditing || !confirm("Are you sure you want to delete this template?")) return
    const res = await deleteContentTemplateAction(template.id!)
    if (res.success) {
      toast.success("Template deleted")
      onSuccess?.()
    } else {
      toast.error(res.error || "Failed to delete template")
    }
  }

  const addPlatform = () => {
    if (newPlatform && !platforms.includes(newPlatform)) {
      setPlatforms([...platforms, newPlatform.toLowerCase()])
      setNewPlatform("")
    }
  }

  const removePlatform = (p: string) => {
    setPlatforms(platforms.filter(plat => plat !== p))
  }

  return (
    <form action={formAction} className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Template Name</Label>
          <Input 
            id="name" 
            name="name" 
            defaultValue={template?.name} 
            placeholder="e.g. LinkedIn Networking, Job Post Header"
            required 
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category">Category / Module</Label>
          <Input 
            id="category" 
            name="category" 
            defaultValue={template?.category} 
            placeholder="e.g. Social, Hiring, Pipeline"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="content">Template Content</Label>
          <Textarea 
            id="content" 
            name="content" 
            defaultValue={template?.content} 
            placeholder="Write your template here... use {{variable}} for placeholders."
            className="min-h-[200px] font-mono text-sm leading-relaxed"
            required 
          />
        </div>

        <div className="space-y-3">
          <Label>Target Platforms</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {platforms.map(p => (
              <Badge key={p} variant="secondary" className="gap-1 px-2 py-1">
                {p}
                <button type="button" onClick={() => removePlatform(p)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              value={newPlatform} 
              onChange={(e) => setNewPlatform(e.target.value)} 
              placeholder="Add platform (e.g. linkedin, twitter)"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPlatform(); } }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addPlatform}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t flex items-center justify-between">
        {isEditing && (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete template
          </Button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isEditing ? "Update template" : "Create template"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

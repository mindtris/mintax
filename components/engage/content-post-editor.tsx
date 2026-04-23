"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { updatePostAction } from "@/app/(app)/engage/posts/actions"

type MediaOption = {
  id: string
  url: string | null
  fileId: string | null
  type: string
}

type Props = {
  postId: string
  initialVisibility: string
  initialSeoTitle: string | null
  initialSeoDescription: string | null
  initialCanonicalPath: string | null
  initialHeroImageId: string | null
  media: MediaOption[]
}

export function ContentPostEditor({
  postId,
  initialVisibility,
  initialSeoTitle,
  initialSeoDescription,
  initialCanonicalPath,
  initialHeroImageId,
  media,
}: Props) {
  type EditorState = { success: true } | { error: string } | null
  const boundAction = async (prev: EditorState, formData: FormData): Promise<EditorState> => {
    const result = await updatePostAction(postId, prev, formData)
    return (result ?? null) as EditorState
  }
  const [state, formAction, pending] = useActionState<EditorState, FormData>(boundAction, null)

  const [visibility, setVisibility] = useState<string>(initialVisibility)
  const [seoTitle, setSeoTitle] = useState<string>(initialSeoTitle ?? "")
  const [seoDescription, setSeoDescription] = useState<string>(initialSeoDescription ?? "")
  const [canonicalPath, setCanonicalPath] = useState<string>(initialCanonicalPath ?? "")
  const [heroImageId, setHeroImageId] = useState<string>(initialHeroImageId ?? "")
  const [dirty, setDirty] = useState<boolean>(false)

  const imageOptions = media.filter((m) => m.type === "image" && m.fileId)

  const markDirty = () => setDirty(true)

  useEffect(() => {
    if (state && "error" in state) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Website publishing</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="flex flex-col gap-5"
          onSubmit={() => {
            setDirty(false)
            setTimeout(() => toast.success("Content settings saved"), 100)
          }}
        >
          <Input type="hidden" name="content" value="" readOnly />
          <Input type="hidden" name="status" value="" readOnly />
          <Input type="hidden" name="visibility" value={visibility} readOnly />
          <Input type="hidden" name="heroImageId" value={heroImageId} readOnly />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Publish to website</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                When on, this post is served from <code className="text-xs">/api/v1/public/content</code>.
              </p>
            </div>
            <Switch
              checked={visibility === "public"}
              onCheckedChange={(v) => {
                setVisibility(v ? "public" : "internal")
                markDirty()
              }}
              aria-label="Publish to website"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="seoTitle" className="text-xs">SEO title</Label>
            <Input
              id="seoTitle"
              name="seoTitle"
              value={seoTitle}
              onChange={(e) => { setSeoTitle(e.target.value); markDirty() }}
              placeholder="Falls back to title if blank"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="seoDescription" className="text-xs">SEO description</Label>
            <Textarea
              id="seoDescription"
              name="seoDescription"
              rows={2}
              value={seoDescription}
              onChange={(e) => { setSeoDescription(e.target.value); markDirty() }}
              placeholder="~155 chars recommended for search snippets"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="canonicalPath" className="text-xs">Canonical path</Label>
            <Input
              id="canonicalPath"
              name="canonicalPath"
              value={canonicalPath}
              onChange={(e) => { setCanonicalPath(e.target.value); markDirty() }}
              placeholder="/blog/how-we-built-x"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs">Hero image</Label>
            {imageOptions.length > 0 ? (
              <Select
                value={heroImageId || "none"}
                onValueChange={(v) => {
                  setHeroImageId(v === "none" ? "" : v)
                  markDirty()
                }}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {imageOptions.map((m) => (
                    <SelectItem key={m.id} value={m.fileId as string}>
                      {m.url ? m.url.split("/").pop() || m.fileId : m.fileId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground">
                Upload an image to this post (Create / Edit flow) to pick one as the hero.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending || !dirty}>
              {pending ? "Saving..." : "Save content settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

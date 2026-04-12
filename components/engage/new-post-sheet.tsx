"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Clock, Loader2, Play, Save, Send, Sparkles, Trash2, Upload } from "lucide-react"
import { useEffect, useActionState, useState } from "react"
import { createPostAction } from "@/app/(app)/engage/posts/actions"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"
import { PlatformSettings } from "./platform-settings"
import { CommentEditor, CommentData } from "./comment-editor"

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  medium: -1,
  devto: -1,
  wordpress: -1,
  hashnode: -1,
}

export function NewPostSheet({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultDate,
  categories,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultDate?: string
  categories?: any[]
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const [state, formAction, pending] = useActionState(createPostAction, null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [content, setContent] = useState("")
  const [mediaItems, setMediaItems] = useState<{ id: string; url: string; name: string; type: string; uploading?: boolean; progress?: number; file?: File }[]>([])
  const [contentType, setContentType] = useState(categories?.[0]?.code || "post")
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [llmPrompts, setLlmPrompts] = useState<{ id: string; name: string }[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string>("")

  useEffect(() => {
    if (open) {
      fetch("/api/social/accounts")
        .then((r) => r.json())
        .then((data) => setAccounts(data.accounts || []))
        .catch(() => {})
      fetch("/api/llm-prompts?module=engage")
        .then((r) => r.json())
        .then((data) => {
          setLlmPrompts(data.prompts || [])
          if (data.prompts?.length > 0) setSelectedPromptId(data.prompts[0].id)
        })
        .catch(() => {
          toast.error("Failed to load AI prompts")
        })
    }
  }, [open])

  useEffect(() => {
    if (state?.success && open) {
      toast.success(state.message || "Post created successfully")
      setOpen(false)
      setMediaItems([])
      setContent("")
      setPlatformSettings({})
      setComments([])
    }
  }, [state, open, setOpen])

  const [platformSettings, setPlatformSettings] = useState<Record<string, Record<string, any>>>({})
  const [comments, setComments] = useState<CommentData[]>([])

  const updatePlatformSetting = (accountId: string, settings: Record<string, any>) => {
    setPlatformSettings(prev => ({ ...prev, [accountId]: settings }))
  }

  const handleFileUpload = async (files: File[]) => {
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      uploading: true,
      progress: 0,
      file,
    }))

    setMediaItems(prev => [...prev, ...newItems])

    for (const item of newItems) {
      const formData = new FormData()
      formData.append("file", item.file)

      try {
        const res = await fetch("/api/social/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error("Upload failed")

        const data = await res.json()
        setMediaItems(prev => prev.map(m => m.id === item.id ? { 
          ...m, 
          id: data.id, 
          url: data.url, 
          uploading: false, 
          progress: 100 
        } : m))
      } catch (err) {
        toast.error(`Failed to upload ${item.name}`)
        setMediaItems(prev => prev.filter(m => m.id !== item.id))
      }
    }
  }

  const activeLimit = selectedAccounts.reduce((min, id) => {
    const account = accounts.find((a: any) => a.id === id)
    if (!account) return min
    const limit = PLATFORM_LIMITS[account.provider] || -1
    if (limit === -1) return min
    if (min === -1) return limit
    return Math.min(min, limit)
  }, -1 as number)

  const isOverLimit = activeLimit > 0 && content.length > activeLimit

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    try {
      const selectedProvider = selectedAccounts.length > 0
        ? accounts.find((a: any) => a.id === selectedAccounts[0])?.provider
        : ""

      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          contentType,
          platform: selectedProvider,
          tone: "professional",
          maxLength: activeLimit > 0 ? activeLimit : 280,
          promptId: selectedPromptId || undefined,
        }),
      })

      const data = await res.json()
      if (data.content) {
        setContent(data.content)
        setAiPrompt("")
      }
    } catch (err) {
      console.error("Generation error:", err)
    }
    setGenerating(false)
  }

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent
        side="right"
        className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>Create post</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select name="contentType" value={contentType} onValueChange={setContentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories && categories.length > 0 ? (
                    categories.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="post">Social Post</SelectItem>
                      <SelectItem value="article">Blog Article</SelectItem>
                      <SelectItem value="thread">Thread</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {(contentType === "article" || contentType === "newsletter") && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="Article title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Input id="excerpt" name="excerpt" placeholder="Brief summary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" name="slug" placeholder="url-slug" />
                  </div>
                </div>
              </>
            )}

            {/* AI Generation */}
            <div className="flex flex-col gap-3 border rounded-md p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI Generate
              </Label>
              {llmPrompts.length > 1 && (
                <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select prompt style" />
                  </SelectTrigger>
                  <SelectContent>
                    {llmPrompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Describe what to post about..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleGenerate())}
                  className="text-sm"
                />
                <Button type="button" size="sm" onClick={handleGenerate} disabled={generating || !aiPrompt.trim()}>
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Content</Label>
                <span className={`text-xs ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {content.length}{activeLimit > 0 ? `/${activeLimit}` : ""} chars
                </span>
              </div>
              <Textarea
                id="content"
                name="content"
                placeholder={contentType === "article" ? "Write your article..." : "What's on your mind?"}
                rows={contentType === "article" ? 10 : 4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={isOverLimit ? "border-destructive" : ""}
                required
              />
              {isOverLimit && (
                <p className="text-xs text-destructive">
                  Exceeds {activeLimit} char limit for selected platform
                </p>
              )}
            </div>

            {/* Comments / Thread */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Thread / First Comment</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[10px]"
                  onClick={() => setComments([...comments, { content: "", delayMinutes: 0, mediaUrls: [] }])}
                >
                  Add thread item
                </Button>
              </div>
              {comments.map((c, i) => (
                <CommentEditor 
                  key={i}
                  index={i}
                  data={c}
                  onChange={(newData) => setComments(prev => prev.map((curr, idx) => idx === i ? newData : curr))}
                  onDelete={() => setComments(prev => prev.filter((_, idx) => idx !== i))}
                />
              ))}
              <input type="hidden" name="comments" value={JSON.stringify(comments)} />
            </div>

            {/* Media upload */}
            <div className="flex flex-col gap-2">
              <Label>Media</Label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFileUpload(Array.from(e.dataTransfer.files)) }}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer bg-muted/5 min-h-[100px] flex flex-col items-center justify-center gap-2"
                onClick={() => document.getElementById("post-media-input")?.click()}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Click or drag images/videos</p>
                  <p className="text-xs text-muted-foreground">Up to 50MB per file</p>
                </div>
                <input id="post-media-input" type="file" multiple className="hidden"
                  accept="image/*,video/*,.gif"
                  onChange={(e) => { if (e.target.files) handleFileUpload(Array.from(e.target.files!)) }}
                />
              </div>

              {mediaItems.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {mediaItems.map((item) => (
                    <div key={item.id} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                      {item.type.startsWith("video") ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/10">
                          <Play className="h-6 w-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                      
                      {item.uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setMediaItems(prev => prev.filter(m => m.id !== item.id))}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      {/* Hidden inputs to pass data to server action */}
                      <input type="hidden" name="mediaUrls" value={item.url} />
                      <input type="hidden" name="mediaIds" value={item.id} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" name="tags" placeholder="marketing, launch" />
            </div>


            {/* Accounts */}
            <div className="flex flex-col gap-2">
              <Label>Publish to</Label>
              {accounts.length > 0 ? (
                <div className="space-y-4">
                  {accounts.map((account: any) => (
                    <div key={account.id} className="space-y-3 p-2 rounded-lg border bg-card/50">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          name="accountIds"
                          value={account.id}
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={() => toggleAccount(account.id)}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {account.picture && <img src={account.picture} alt="" className="h-5 w-5 rounded-full" />}
                          <span className="text-sm font-medium">{account.name}</span>
                          <Badge variant="outline" className="text-[10px] h-4 py-0 capitalize">{account.provider}</Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {PLATFORM_LIMITS[account.provider] > 0 ? `${PLATFORM_LIMITS[account.provider]}` : "∞"}
                        </span>
                      </label>

                      {selectedAccounts.includes(account.id) && (
                        <div className="pl-7 pr-2 pb-1 transition-all">
                          <PlatformSettings 
                            provider={account.provider}
                            accountId={account.id}
                            settings={platformSettings[account.id] || {}}
                            onChange={(s) => updatePlatformSetting(account.id, s)}
                          />
                          <input 
                            type="hidden" 
                            name={`settings_${account.id}`} 
                            value={JSON.stringify(platformSettings[account.id] || {})} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <a href="/engage/social" className="text-primary underline">Connect an account</a> to start posting
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="scheduledAt">Schedule</Label>
              <DatePicker 
                id="scheduledAt" 
                name="scheduledAt" 
                defaultValue={defaultDate ? new Date(`${defaultDate}T09:00`) : undefined} 
              />
              <p className="text-[10px] text-muted-foreground italic">Leave empty to publish immediately if Publish is clicked.</p>
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          </div>

          <div className="shrink-0 px-6 py-4 flex gap-2 border-t">
            <Button type="submit" name="action" value="draft" variant="outline" disabled={pending || isOverLimit} className="flex-1">
              <Save className="h-4 w-4" /> Draft
            </Button>
            <Button type="submit" name="action" value="schedule" variant="secondary" disabled={pending || isOverLimit} className="flex-1">
              <Clock className="h-4 w-4" /> Schedule
            </Button>
            <Button type="submit" name="action" value="publish_now" disabled={pending || isOverLimit} className="flex-1">
              <Send className="h-4 w-4" /> Publish
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

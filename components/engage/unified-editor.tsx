"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ArrowLeft, Save, Send, Sparkles, Settings2, Globe, Search,
  Plus, Share2, Image as ImageIcon, Loader2, Eye, Trash2,
  FileText, History, Briefcase, Tag, X, User, Wand2, ChevronDown
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { CoverImagePicker } from "@/components/engage/cover-image-picker"
import { BlogEditor } from "@/components/engage/blog-editor"
import slugify from "slugify"

// ─── Static Type Definitions ──────────────────────────────────────────────────

const WEBSITE_TYPES = [
  { code: "blog", name: "Blog", icon: Globe, group: "content" },
  { code: "doc", name: "Documentation", icon: FileText, group: "docs" },
  { code: "legal", name: "Legal docs", icon: FileText, group: "docs" },
  { code: "api-docs", name: "API documentation", icon: Settings2, group: "docs" },
  { code: "help", name: "Help guides", icon: Settings2, group: "docs" },
  { code: "knowledge", name: "Knowledge base", icon: History, group: "docs" },
]

const SOCIAL_TYPES = [
  { code: "post", name: "Post", icon: Share2, group: "social" },
  { code: "thread", name: "Thread", icon: FileText, group: "social" },
  { code: "poll", name: "Poll", icon: Settings2, group: "social" },
  { code: "video", name: "Video", icon: Sparkles, group: "social" },
  { code: "announcement", name: "Announcement", icon: Sparkles, group: "social" },
]

const WEBSITE_CODES = new Set(WEBSITE_TYPES.map(t => t.code))
const SOCIAL_CODES = new Set(SOCIAL_TYPES.map(t => t.code))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function readingTime(words: number) {
  const m = Math.ceil(words / 200)
  return m <= 1 ? "< 1 min read" : `${m} min read`
}

function autoSlug(title: string) {
  return slugify(title, { lower: true, strict: true, trim: true })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UnifiedEditorProps {
  categories: any[]
  initialAccounts: any[]
  orgMembers?: { id: string; user: { id: string; name: string; avatar?: string | null } }[]
  initialPost?: any
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UnifiedEditor({ categories, initialAccounts, orgMembers = [], initialPost }: UnifiedEditorProps) {
  const router = useRouter()

  // Intent selectors
  const [editorGroup, setEditorGroup] = useState<"social" | "website" | null>(initialPost ? (initialPost.socialAccountId ? "social" : "website") : null)
  const [contentType, setContentType] = useState<string | null>(initialPost?.type || initialPost?.contentType || null)

  // Core content
  const [title, setTitle] = useState(initialPost?.title || "")
  const [content, setContent] = useState(initialPost?.content || "") // JSON string for blog, plain text for social
  const [plainText, setPlainText] = useState("") // always plain text for AI / word count

  // Blog-specific
  const [coverUrl, setCoverUrl] = useState<string | null>(initialPost?.coverUrl || null)
  const [heroImageId, setHeroImageId] = useState<string | null>(initialPost?.heroImageId || null)
  const [tags, setTags] = useState<string[]>(initialPost?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [authorId, setAuthorId] = useState<string>(initialPost?.userId || "")
  const [categoryId, setCategoryId] = useState<string>(initialPost?.categoryId || "")
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "")

  // SEO
  const [slug, setSlug] = useState(initialPost?.slug || "")
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle || "")
  const [seoDescription, setSeoDescription] = useState(initialPost?.seoDescription || "")
  const [visibility, setVisibility] = useState<"internal" | "public">(initialPost?.visibility || "internal")

  // Social
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(initialPost?.socialAccountId ? [initialPost.socialAccountId] : (initialPost?.accountIds || []))
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(initialPost?.scheduledAt ? new Date(initialPost.scheduledAt) : undefined)

  // Misc media for social posts
  const [mediaItems, setMediaItems] = useState<{ id: string; url: string; name: string; type: string; uploading?: boolean }[]>(initialPost?.mediaUrls?.map((u: string, i: number) => ({
    id: initialPost.mediaIds?.[i] || Math.random().toString(),
    url: u,
    type: u.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image",
    name: "Media"
  })) || [])

  // UI states
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [pollOptions, setPollOptions] = useState<string[]>(["Yes", "No"])

  // Derived flags
  const isContentOnly = contentType ? WEBSITE_CODES.has(contentType) : false
  const isSocial = editorGroup === "social"

  // Auto-slug from title (debounced)
  const slugDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!isContentOnly || !title) return
    if (slugDebounce.current) clearTimeout(slugDebounce.current)
    slugDebounce.current = setTimeout(() => {
      if (!slug || slug === autoSlug(title.slice(0, title.length - 1))) {
        setSlug(autoSlug(title))
      }
    }, 600)
    return () => { if (slugDebounce.current) clearTimeout(slugDebounce.current) }
  }, [title])

  // Word count
  const wordCount = countWords(plainText || content)

  // ─── AI Helpers ─────────────────────────────────────────────────────────────

  const callAI = useCallback(async (task: string, contentOverride?: string) => {
    setAiLoading(task)
    try {
      const res = await fetch("/api/engage/ai", {
        method: "POST",
        body: JSON.stringify({ task, content: contentOverride || content, title, contentType }),
      })
      const data = await res.json()
      return data
    } catch (err) {
      toast.error("AI failed to respond")
      return null
    } finally {
      setAiLoading(null)
    }
  }, [content, title, contentType])

  const generateTitles = async () => {
    const data = await callAI("title")
    if (data?.titles) setTitleSuggestions(data.titles)
  }

  const autoFillSEO = async () => {
    const data = await callAI("seo")
    if (data?.seoTitle) setSeoTitle(data.seoTitle)
    if (data?.seoDescription) setSeoDescription(data.seoDescription)
    toast.success("SEO fields filled")
  }

  const generateExcerpt = async () => {
    const data = await callAI("excerpt")
    if (data?.excerpt) setExcerpt(data.excerpt)
  }

  const generateFullPost = async () => {
    const data = await callAI("generate")
    if (data) {
      if (data.title) setTitle(data.title)
      if (data.content) setContent(data.content)
      if (data.seoTitle) setSeoTitle(data.seoTitle)
      if (data.seoDescription) setSeoDescription(data.seoDescription)
      if (data.excerpt) setExcerpt(data.excerpt)
      toast.success("Blog post and SEO metadata generated!")
    }
  }

  const generateSocialPost = async () => {
    if (!title) return
    const data = await callAI("generate_social")
    if (data?.content) {
      setContent(data.content)
      if (data.pollOptions) setPollOptions(data.pollOptions)
      toast.success(contentType === "thread" ? "Thread drafted" : "Post drafted")
    }
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  const onSave = async (status: string) => {
    if (!contentType) { toast.error("Please select a content type"); return }
    setLoading(true)
    try {
      const isUpdate = !!initialPost?.id
      const res = await fetch("/api/engage/posts", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialPost?.id,
          contentType,
          title: isContentOnly ? title : (title || content.slice(0, 50) + "..."),
          content,
          excerpt: isBlog ? excerpt : undefined,
          accountIds: selectedAccounts,
          scheduledAt,
          status,
          visibility,
          slug,
          seoTitle,
          seoDescription,
          heroImageId,
          tags,
          mediaUrls: mediaItems.map(m => m.url),
          mediaIds: mediaItems.map(m => m.id),
        }),
      })
      if (!res.ok) throw new Error("Failed to save post")
      toast.success(status === "published" ? "Published!" : (isUpdate ? "Changes saved" : "Draft saved"))
      router.push("/engage?tab=posts")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    const previewData = {
      title,
      content,
      contentType,
      excerpt,
      coverUrl,
      tags,
      authorName: orgMembers.find(m => m.id === authorId)?.user.name || "Administrator"
    }
    localStorage.setItem("mintax_preview_data", JSON.stringify(previewData))
    window.open("/engage/content/preview", "_blank")
  }

  // ─── Media Upload (social) ───────────────────────────────────────────────────

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      const tempId = Math.random().toString(36).substring(7)
      setMediaItems(prev => [...prev, { id: tempId, url: URL.createObjectURL(file), name: file.name, type: file.type, uploading: true }])
      try {
        const res = await fetch("/api/social/upload", { method: "POST", body: formData })
        const data = await res.json()
        setMediaItems(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, url: data.url, uploading: false } : m))
      } catch {
        setMediaItems(prev => prev.filter(m => m.id !== tempId))
        toast.error(`Failed to upload ${file.name}`)
      }
    }
  }

  // ─── Tags ────────────────────────────────────────────────────────────────────

  const addTag = (value: string) => {
    const t = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput("")
  }

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-24">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/engage?tab=posts">
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full bg-muted/50 hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {!editorGroup ? "Create something new" : isContentOnly ? (title || "New post") : "New social post"}
            </h1>
            {isContentOnly && contentType && wordCount > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {wordCount} words · {readingTime(wordCount)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contentType && (
            <>
              {/* Social: media upload trigger */}
              {isSocial && (
                <>
                  <input id="header-media-upload" type="file" multiple className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))} />
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-primary"
                    onClick={() => document.getElementById("header-media-upload")?.click()}>
                    <ImageIcon className="h-4 w-4 mr-2" />Media
                  </Button>
                </>
              )}

              {/* Social: channel popover */}
              {isSocial && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-primary">
                      <Share2 className="h-4 w-4 mr-2" />
                      Channels
                      {selectedAccounts.length > 0 && (
                        <Badge className="ml-2 h-4 px-1 text-[10px] bg-primary/10 text-primary border-transparent">
                          {selectedAccounts.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 rounded-md" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Select Channels</p>
                        <span className="text-[9px] text-primary cursor-pointer hover:underline"
                          onClick={() => setSelectedAccounts(initialAccounts.map(a => a.id))}>Select all</span>
                      </div>
                      <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                        {initialAccounts.map(account => (
                          <label key={account.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors">
                            <Checkbox checked={selectedAccounts.includes(account.id)}
                              onCheckedChange={(checked) =>
                                setSelectedAccounts(prev => checked ? [...prev, account.id] : prev.filter(id => id !== account.id))} />
                            <div className="flex items-center gap-2 overflow-hidden">
                              {account.picture
                                ? <img src={account.picture} className="w-4 h-4 rounded-full shrink-0" />
                                : <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] shrink-0">{account.provider[0].toUpperCase()}</div>
                              }
                              <span className="text-xs truncate">{account.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <div className="h-4 w-px bg-border mx-1" />

              {/* Blog: preview */}
              {isContentOnly && (
                <Button variant="outline" size="sm" className="h-9 px-4 bg-card" onClick={handlePreview}>
                  <Eye className="h-3.5 w-3.5 mr-2" />Preview
                </Button>
              )}

              <Button variant="ghost" className="h-9" onClick={() => onSave("draft")} disabled={loading}>
                <Save className="h-3.5 w-3.5 mr-2 text-muted-foreground" />Save draft
              </Button>

              <DatePicker date={scheduledAt} setDate={setScheduledAt} variant="secondary" className="w-auto h-9" />

              <Button variant="default" className="h-9 shadow-sm pl-4 pr-5 font-medium"
                onClick={() => onSave(scheduledAt ? "scheduled" : "published")} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Send className="h-3.5 w-3.5 mr-2" />}
                {scheduledAt ? "Schedule" : "Publish"}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── Canvas ── */}
        <div className="lg:col-span-8 space-y-5">

          {/* Cascading selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={editorGroup || ""} onValueChange={(val: "social" | "website") => { setEditorGroup(val); setContentType(null) }}>
              <SelectTrigger className="h-12 bg-card border-border/60 rounded-md px-4 font-normal shadow-sm text-base">
                <SelectValue placeholder="Select stream..." />
              </SelectTrigger>
              <SelectContent className="rounded-md p-1 shadow-2xl">
                <SelectItem value="social" className="py-2.5 px-3 rounded-sm cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0"><Share2 className="h-4 w-4" /></div>
                    <span className="text-sm font-medium">Social stream</span>
                  </div>
                </SelectItem>
                <SelectItem value="website" className="py-2.5 px-3 rounded-sm cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0"><Globe className="h-4 w-4" /></div>
                    <span className="text-sm font-medium">Website publishing</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {editorGroup && (
              <Select value={contentType || ""} onValueChange={setContentType}>
                <SelectTrigger className="h-12 bg-card border-border/60 rounded-md px-4 font-normal shadow-sm text-base">
                  <SelectValue placeholder="Select format..." />
                </SelectTrigger>
                <SelectContent className="rounded-md p-1 shadow-2xl">
                  {editorGroup === "website" ? (
                    <>
                      <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Content</div>
                      {WEBSITE_TYPES.filter(t => t.group === "content").map(t => (
                        <SelectItem key={t.code} value={t.code} className="py-2.5 px-3 rounded-sm cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0"><t.icon className="h-4 w-4" /></div>
                            <span className="text-sm font-medium">{t.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="px-3 pt-2 pb-1.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-widest border-t mt-1">Documentation</div>
                      {WEBSITE_TYPES.filter(t => t.group === "docs").map(t => (
                        <SelectItem key={t.code} value={t.code} className="py-2.5 px-3 rounded-sm cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0"><t.icon className="h-4 w-4" /></div>
                            <span className="text-sm font-medium">{t.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  ) : (
                    SOCIAL_TYPES.map(t => (
                      <SelectItem key={t.code} value={t.code} className="py-2.5 px-3 rounded-sm cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0"><t.icon className="h-4 w-4" /></div>
                          <span className="text-sm font-medium">{t.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Editor Area */}
          {!contentType ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] rounded-md text-muted-foreground">
              {/* Optional subtle empty state or just completely blank if preferred. We'll leave it truly empty so the user feels they must just fill the selector out. */}
            </div>
          ) : isContentOnly ? (
            <div className="flex flex-col gap-5 w-full">
              {/* Title Input */}
              <div className="space-y-2 shrink-0">
                <div className="relative flex items-center">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter article title or topic..."
                    className="h-12 text-base font-medium shadow-sm shadow-black/[0.02] bg-card pr-36"
                  />
                  <div className="absolute right-1.5">
                    <Button
                      onClick={generateFullPost}
                      disabled={aiLoading === "generate" || !title}
                      size="sm"
                      className="gap-1.5 font-bold uppercase tracking-tight shadow-md h-9"
                    >
                      {aiLoading === "generate" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Ask AI
                    </Button>
                  </div>
                </div>
                {titleSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 pl-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground self-center">AI suggestions:</span>
                    {titleSuggestions.map((s, i) => (
                      <button key={i} onClick={() => { setTitle(s); setTitleSuggestions([]) }}
                        className="text-[11px] bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 transition-colors">
                        {s}
                      </button>
                    ))}
                    <button onClick={() => setTitleSuggestions([])} className="text-[10px] text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity ml-2">Clear</button>
                  </div>
                )}
              </div>

              {/* Editor Card */}
              <Card className="border bg-card shadow-sm shadow-black/[0.02] flex flex-col overflow-hidden min-h-[500px] w-full">
                {/* Toolbar & Rich text area (Tiptap) */}
                <div className="flex-1 flex flex-col bg-background">
                  <BlogEditor
                    content={content}
                    onChange={(json, plain) => { setContent(json); setPlainText(plain) }}
                    className="flex-1 w-full"
                  />
                </div>

                {/* Footer bar */}
                <div className="flex items-center px-6 py-3 border-t border-input bg-muted/20 mt-auto">
                  <span className="text-xs text-muted-foreground tabular-nums tracking-wide font-medium">
                    {wordCount} words · {readingTime(wordCount)}
                  </span>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col gap-5 w-full">
              {/* Topic Input row (Outside the card) */}
              <div className="space-y-2 shrink-0">
                <div className="relative flex items-center">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter social post topic or hook..."
                    className="h-12 text-base font-medium shadow-sm shadow-black/[0.02] bg-card pr-36"
                  />
                  <div className="absolute right-1.5">
                    <Button
                      onClick={generateSocialPost}
                      disabled={aiLoading === "generate_social" || !title}
                      size="sm"
                      className="gap-1.5 font-bold uppercase tracking-tight shadow-md h-9"
                    >
                      {aiLoading === "generate_social" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Ask AI
                    </Button>
                  </div>
                </div>
                
                {titleSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 pl-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground self-center">AI suggestions:</span>
                    {titleSuggestions.map((s, i) => (
                      <button key={i} onClick={() => { setTitle(s); setTitleSuggestions([]) }}
                        className="text-[11px] bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 transition-colors">
                        {s}
                      </button>
                    ))}
                    <button onClick={() => setTitleSuggestions([])} className="text-[10px] text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity ml-2">Clear</button>
                  </div>
                )}
              </div>

              <Card className="border bg-card shadow-sm shadow-black/[0.02]">
                <CardContent className="p-6 space-y-6">
                  {isSocial && (
                    <div className="space-y-6">

                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={contentType === "poll" ? "Ask a question..." : "Compose your update here..."}
                          className="border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 resize-none py-0 leading-relaxed font-medium min-h-[300px] text-2xl"
                        />
                        
                        {contentType === "poll" && (
                          <div className="space-y-3 mt-8 border-t pt-8">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Poll Options</Label>
                            <div className="grid gap-2">
                              {pollOptions.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                  <Input 
                                    value={opt} 
                                    onChange={(e) => {
                                      const newOpts = [...pollOptions]
                                      newOpts[i] = e.target.value
                                      setPollOptions(newOpts)
                                    }}
                                    className="h-10 bg-muted/30 border-none focus-visible:ring-1"
                                    placeholder={`Option ${i+1}`}
                                  />
                                  {pollOptions.length > 2 && (
                                    <Button variant="ghost" size="sm" className="h-10 w-10 shrink-0" onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}>
                                      <Trash2 className="h-4 w-4 opacity-40" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {pollOptions.length < 4 && (
                                <Button variant="outline" size="sm" className="h-10 border-dashed justify-start px-4 text-muted-foreground" onClick={() => setPollOptions(prev => [...prev, ""])}>
                                  <Plus className="h-3.5 w-3.5 mr-2" /> Add Option
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      
                      {mediaItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 border-t pt-8">
                          {mediaItems.map(item => (
                            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-muted bg-muted group shadow-sm">
                              <img src={item.url} alt="" className="w-full h-full object-cover" />
                              {item.uploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                                </div>
                              )}
                              <button onClick={() => setMediaItems(prev => prev.filter(m => m.id !== item.id))}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl hover:bg-muted/50 transition-colors aspect-square text-muted-foreground">
                            <Plus className="h-5 w-5 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Add</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                {isSocial && (
                    <div className="flex items-center justify-end px-6 py-3 border-t border-input bg-muted/20 gap-3">
                        <div className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border tabular-nums transition-colors", 
                          content.length > 280 
                            ? "border-destructive/20 text-destructive bg-destructive/5" 
                            : "border-border/60 text-muted-foreground bg-background/50 shadow-sm")}>
                          X: {content.length}/280
                        </div>
                        <div className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border tabular-nums transition-colors",
                          content.length > 3000
                            ? "border-destructive/20 text-destructive bg-destructive/5"
                            : "border-border/60 text-muted-foreground bg-background/50 shadow-sm")}>
                          LI: {content.length}/3000
                        </div>
                    </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">

          {isSocial && (
            <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm shadow-black/[0.02]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Channel Preview</h3>
                <Badge variant="secondary" className="text-[9px] font-bold uppercase">X / Twitter</Badge>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-muted border flex items-center justify-center font-bold text-xs shrink-0">
                  {orgMembers?.[0]?.user?.name?.[0] || "A"}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold truncate">{orgMembers?.[0]?.user?.name || "Administrator"}</span>
                    <span className="text-xs text-muted-foreground opacity-60">@mintax</span>
                  </div>
                  <p className="text-sm leading-relaxed break-words">
                    {content || "Your social update will appear here..."}
                  </p>
                  {mediaItems.length > 0 && (
                    <div className="mt-3 rounded-xl overflow-hidden border bg-muted aspect-video">
                      <img src={mediaItems[0].url} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 text-muted-foreground opacity-50">
                    <Share2 className="h-3.5 w-3.5" />
                    <ArrowLeft className="h-3.5 w-3.5 rotate-45" />
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isContentOnly && (
            <>
              {/* Cover Image Block */}
              <div className="bg-card border rounded-md p-4 space-y-3 shadow-sm shadow-black/[0.02]">
                <h3 className="text-sm font-medium">
                  Cover image
                </h3>
                <CoverImagePicker
                  value={coverUrl}
                  heroImageId={heroImageId}
                  onChange={(url, id) => { setCoverUrl(url); setHeroImageId(id) }}
                  onRemove={() => { setCoverUrl(null); setHeroImageId(null) }}
                />
              </div>

              {/* Author Block */}
              {orgMembers.length > 0 && (
                <div className="bg-card border rounded-md p-4 space-y-3 shadow-sm shadow-black/[0.02]">
                  <h3 className="text-sm font-medium">
                    Author
                  </h3>
                  <Select value={authorId} onValueChange={setAuthorId}>
                    <SelectTrigger className="h-9 rounded-md text-sm">
                      <SelectValue placeholder="Select author..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {orgMembers.map(m => (
                        <SelectItem key={m.user.id} value={m.user.id} className="rounded-sm">
                          <div className="flex items-center gap-2">
                            {m.user.avatar
                              ? <img src={m.user.avatar} className="h-5 w-5 rounded-full" />
                              : <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px]">{m.user.name[0]}</div>
                            }
                            <span className="text-sm">{m.user.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Category Block */}
              {categories.length > 0 && (
                <div className="bg-card border rounded-md p-4 space-y-3 shadow-sm shadow-black/[0.02]">
                  <h3 className="text-sm font-medium">
                    Category
                  </h3>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-9 rounded-md text-sm">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id} className="rounded-sm">
                          <span className="text-sm">{c.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tags Block */}
              <div className="bg-card border rounded-md p-4 space-y-3 shadow-sm shadow-black/[0.02]">
                <h3 className="text-sm font-medium">
                  Tags
                </h3>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 min-h-9 p-2 rounded-md border border-input bg-background focus-within:border-ring transition-colors">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-[11px] bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
                        #{tag}
                        <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="hover:text-destructive transition-colors">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput) }
                        if (e.key === "Backspace" && !tagInput && tags.length) setTags(prev => prev.slice(0, -1))
                      }}
                      onBlur={() => tagInput && addTag(tagInput)}
                      placeholder={tags.length === 0 ? "Add tags..." : ""}
                      className="flex-1 min-w-[80px] bg-transparent text-xs border-none focus:outline-none placeholder:text-muted-foreground/50 h-6"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Press Enter or comma to add</p>
                </div>
              </div>
            </>
          )}

          {/* SEO Block - For all content types (Blog, Legal, Docs, etc.) */}
          {isContentOnly && (
            <div className="bg-card border rounded-md p-4 space-y-5 shadow-sm shadow-black/[0.02]">
              <h3 className="text-sm font-medium">
                SEO & URL
              </h3>

              <div className="flex items-center justify-between px-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Published</Label>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{visibility === "public" ? "Visible via public API" : "Internal only"}</p>
                </div>
                <Switch checked={visibility === "public"} onCheckedChange={(c) => setVisibility(c ? "public" : "internal")} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">URL slug</Label>
                <div className="flex items-center h-9 w-full rounded-md border border-input bg-muted/20 px-3 text-sm text-muted-foreground focus-within:border-ring transition-colors">
                  <Globe className="h-3.5 w-3.5 mr-1.5 shrink-0 opacity-50" />
                  <span className="shrink-0 opacity-60">mintax.ai/{contentType === 'blog' ? "blog/" : "docs/"}</span>
                  <input className="bg-transparent border-none focus:outline-none text-foreground ml-0.5 w-full h-full text-sm"
                    placeholder="my-post" value={slug} onChange={e => setSlug(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">SEO title</Label>
                  <span className={cn("text-[10px] tabular-nums", seoTitle.length > 60 ? "text-destructive" : "text-muted-foreground/60")}>
                    {seoTitle.length}/60
                  </span>
                </div>
                <Input placeholder="Enter meta title..." className="h-9" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Meta description</Label>
                  <span className={cn("text-[10px] tabular-nums", seoDescription.length > 160 ? "text-destructive" : "text-muted-foreground/60")}>
                    {seoDescription.length}/160
                  </span>
                </div>
                <Textarea placeholder="Brief summary for search engines..." className="text-xs min-h-[80px]"
                  value={seoDescription} onChange={e => setSeoDescription(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

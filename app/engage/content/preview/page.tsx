"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User } from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"

function PreviewRenderer({ content }: { content: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: true }),
    ],
    content: (() => {
      try {
        return JSON.parse(content)
      } catch {
        return content
      }
    })(),
    editorProps: {
      attributes: {
        class: "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-black prose-p:text-lg prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline",
      },
    },
  })

  return <EditorContent editor={editor} />
}

export default function PreviewPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const raw = localStorage.getItem("mintax_preview_data")
    if (raw) {
      try {
        setData(JSON.parse(raw))
      } catch (e) {
        console.error("Failed to parse preview data", e)
      }
    }
  }, [])

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground font-medium">Loading preview...</p>
      </div>
    )
  }

  const { title, content, contentType, excerpt, coverUrl, authorName, tags } = data

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <article className="space-y-6">
          {/* Hero Section */}
          <div className="space-y-4">
            {coverUrl && (
              <img src={coverUrl} alt="" className="w-full aspect-video object-cover rounded-3xl shadow-2xl border border-border/50" />
            )}
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full">{contentType}</Badge>
                {tags?.map((t: string) => (
                  <span key={t} className="text-[10px] font-bold text-primary/70 uppercase">#{t}</span>
                ))}
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] text-foreground">
                {title || "Untitled Article"}
              </h1>
              
              {excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed italic border-l-4 border-primary/30 pl-6 py-2">
                  {excerpt}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="h-12 w-12 rounded-full bg-muted border-2 border-background shadow-md flex items-center justify-center font-bold text-sm">
                {authorName?.[0] || <User className="h-5 w-5" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{authorName || "Administrator"}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Published {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · 5 min read
                </span>
              </div>
            </div>
          </div>

          <Separator className="opacity-30 my-2" />

          {/* Content Body */}
          <div className="pb-32">
             <PreviewRenderer content={content} />
          </div>
        </article>
      </main>
    </div>
  )
}

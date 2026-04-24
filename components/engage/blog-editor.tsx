"use client"

import { useEffect, useRef } from "react"
import { Editor, EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import cn from "clsx"
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, ImageIcon, Link as LinkIcon, Minus
} from "lucide-react"

// We use Tiptap directly as a fallback in case novel has peer dep issues.
// Novel is a thin wrapper over Tiptap — this gives us the same rich editing
// without the additional bundle weight or potential import issues.

interface BlogEditorProps {
  content: string
  onChange: (json: string, plainText: string) => void
  placeholder?: string
  className?: string
}

export function BlogEditor({ content, onChange, placeholder, className }: BlogEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({
        emptyEditorClass: 'is-editor-empty',
        placeholder: placeholder || 'Start writing your story...',
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: (() => {
      if (!content) return ""
      try {
        return JSON.parse(content)
      } catch {
        return content // plain text fallback
      }
    })(),
    editorProps: {
      attributes: {
        class: "outline-none prose prose-neutral dark:prose-invert max-w-none min-h-[400px] p-6 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      const json = JSON.stringify(editor.getJSON())
      const plainText = editor.getText()
      onChange(json, plainText)
    },
  })

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {editor && <FixedToolbar editor={editor} />}
      <div 
        className="flex-1 cursor-text" 
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus()
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function FixedToolbar({ editor }: { editor: Editor }) {
  const addImage = () => {
    const url = window.prompt("Enter image URL:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)

    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 bg-background border-b border-input px-2 py-1.5 shrink-0">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        icon={<Bold className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        icon={<Italic className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        icon={<Strikethrough className="w-4 h-4" />}
      />
      
      <div className="w-px h-4 bg-border mx-1.5" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        icon={<Heading1 className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        icon={<Heading2 className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        icon={<Heading3 className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        active={editor.isActive("heading", { level: 4 })}
        icon={<Heading4 className="w-4 h-4" />}
      />
      
      <div className="w-px h-4 bg-border mx-1.5" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        icon={<List className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        icon={<ListOrdered className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        icon={<Quote className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        icon={<Minus className="w-4 h-4" />}
      />
      
      <div className="w-px h-4 bg-border mx-1.5" />

      <ToolbarButton
        onClick={setLink}
        active={editor.isActive("link")}
        icon={<LinkIcon className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={addImage}
        active={editor.isActive("image")}
        icon={<ImageIcon className="w-4 h-4" />}
      />
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  icon,
  className,
}: {
  onClick: () => void
  active: boolean
  icon: React.ReactNode
  className?: string
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        "w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        className
      )}
    >
      {icon}
    </button>
  )
}

export function getWordCount(json: string): number {
  try {
    const parsed = JSON.parse(json)
    const text = extractText(parsed)
    const words = text.trim().split(/\s+/).filter(Boolean)
    return words.length
  } catch {
    return 0
  }
}

export function getReadingTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / 200)
  return minutes <= 1 ? "< 1 min read" : `${minutes} min read`
}

function extractText(node: any): string {
  if (!node) return ""
  if (node.type === "text") return node.text || ""
  if (node.content) return node.content.map(extractText).join(" ")
  return ""
}

"use client"

import { Card } from "@/components/ui/card"
import { ExternalLink, Link as LinkIcon, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface QuicklinkData {
  id: string
  title: string
  url: string
  category: string
}

export function QuicklinkCard({ link }: { link: QuicklinkData }) {
  let domain = ""
  try {
    domain = new URL(link.url).hostname.replace("www.", "")
  } catch (e) {
    domain = link.url
  }

  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : ""

  return (
    <Card className="group relative overflow-hidden p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-orange-50 flex items-center justify-center border text-orange-600 overflow-hidden">
             {faviconUrl ? (
               <img src={faviconUrl} alt={domain} className="h-6 w-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
             ) : (
               <LinkIcon className="h-5 w-5" />
             )}
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-base leading-tight truncate max-w-[200px]">{link.title}</h3>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">{domain}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {link.category}
        </span>
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50 rounded-md p-1.5 transition-colors"
          title={`Open ${link.title}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </Card>
  )
}

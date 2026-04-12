"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export interface PlatformSettingsProps {
  provider: string
  accountId: string
  settings: Record<string, any>
  onChange: (settings: Record<string, any>) => void
}

export function PlatformSettings({ provider, accountId, settings, onChange }: PlatformSettingsProps) {
  const [toolsData, setToolsData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const fetchToolData = async (tool: string, params: Record<string, any> = {}) => {
    setLoading(prev => ({ ...prev, [tool]: true }))
    try {
      const res = await fetch(`/api/social/${provider}/tools/${tool}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, ...params }),
      })
      if (res.ok) {
        const data = await res.json()
        setToolsData(prev => ({ ...prev, [tool]: data }))
      }
    } catch (err) {
      console.error(`Failed to fetch tool ${tool}:`, err)
    }
    setLoading(prev => ({ ...prev, [tool]: false }))
  }

  useEffect(() => {
    if (provider === "reddit") {
      fetchToolData("subreddits")
    } else if (provider === "youtube") {
      fetchToolData("categories")
      fetchToolData("playlists")
    } else if (provider === "pinterest") {
      fetchToolData("boards")
    }
  }, [provider, accountId])

  const updateSetting = (key: string, value: any) => {
    onChange({ ...settings, [key]: value })
  }

  if (provider === "reddit") {
    return (
      <div className="space-y-3 p-3 border rounded-md bg-muted/20">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Reddit Settings</p>
        <div className="space-y-1">
          <Label className="text-xs">Subreddit</Label>
          <Select value={settings.subreddit || ""} onValueChange={(v) => updateSetting("subreddit", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select subreddit" />
            </SelectTrigger>
            <SelectContent>
              {loading.subreddits ? (
                <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : (
                toolsData.subreddits?.map((s: any) => (
                  <SelectItem key={s.id} value={s.name}>r/{s.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  if (provider === "youtube") {
    return (
      <div className="space-y-3 p-3 border rounded-md bg-muted/20">
        <p className="text-xs font-semibold uppercase text-muted-foreground">YouTube Settings</p>
        <div className="space-y-1">
          <Label className="text-xs">Video Title</Label>
          <Input 
            className="h-8 text-xs" 
            value={settings.title || ""} 
            onChange={(e) => updateSetting("title", e.target.value)} 
            placeholder="Defaults to post content/title"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Privacy</Label>
            <Select value={settings.privacy || "public"} onValueChange={(v) => updateSetting("privacy", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={settings.category || ""} onValueChange={(v) => updateSetting("category", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {toolsData.categories?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  if (provider === "linkedin") {
    return (
      <div className="space-y-3 p-3 border rounded-md bg-muted/20">
        <p className="text-xs font-semibold uppercase text-muted-foreground">LinkedIn Settings</p>
        <div className="flex items-center gap-2">
          <Checkbox 
            id={`li-company-${accountId}`} 
            checked={settings.asCompany || false} 
            onCheckedChange={(v) => updateSetting("asCompany", v)} 
          />
          <Label htmlFor={`li-company-${accountId}`} className="text-xs">Post as Company</Label>
        </div>
      </div>
    )
  }

  return null
}

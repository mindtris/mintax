"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Facebook,
  Instagram,
  Linkedin,
  Plus,
  Twitter,
  Youtube,
  Globe,
  MessageCircle,
  Hash,
  Send,
  Tv,
  Rss,
  Pen,
  Podcast,
  Radio,
  Zap,
  Users,
  Gamepad2,
  Palette,
  BookOpen,
  Code,
  FileText,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

// ── Provider definitions ────────────────────────────────────────────────────

interface ProviderDef {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  auth: "oauth" | "apikey" | "webhook" | "credentials"
  fields?: { key: string; label: string; placeholder: string; type?: string }[]
}

const oauthProviders: ProviderDef[] = [
  { id: "twitter", label: "X (Twitter)", icon: Twitter, auth: "oauth" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, auth: "oauth" },
  { id: "facebook", label: "Facebook", icon: Facebook, auth: "oauth" },
  { id: "instagram", label: "Instagram", icon: Instagram, auth: "oauth" },
  { id: "threads", label: "Threads", icon: Hash, auth: "oauth" },
  { id: "tiktok", label: "TikTok", icon: Tv, auth: "oauth" },
  { id: "youtube", label: "YouTube", icon: Youtube, auth: "oauth" },
  { id: "pinterest", label: "Pinterest", icon: Palette, auth: "oauth" },
  { id: "reddit", label: "Reddit", icon: MessageCircle, auth: "oauth" },
  { id: "gmb", label: "Google My Business", icon: Globe, auth: "oauth" },
  { id: "dribbble", label: "Dribbble", icon: Palette, auth: "oauth" },
  { id: "twitch", label: "Twitch", icon: Gamepad2, auth: "oauth" },
]

const apiKeyProviders: ProviderDef[] = [
  {
    id: "bluesky", label: "Bluesky", icon: Zap, auth: "credentials",
    fields: [
      { key: "username", label: "Handle", placeholder: "yourname.bsky.social" },
      { key: "apiKey", label: "App password", placeholder: "xxxx-xxxx-xxxx-xxxx", type: "password" },
    ],
  },
  {
    id: "mastodon", label: "Mastodon", icon: Radio, auth: "credentials",
    fields: [
      { key: "instanceUrl", label: "Instance URL", placeholder: "https://mastodon.social" },
      { key: "apiKey", label: "Access token", placeholder: "Your access token", type: "password" },
    ],
  },
  {
    id: "telegram", label: "Telegram", icon: Send, auth: "credentials",
    fields: [
      { key: "apiKey", label: "Bot token", placeholder: "123456:ABC-DEF...", type: "password" },
      { key: "username", label: "Chat ID", placeholder: "-100123456789" },
    ],
  },
  {
    id: "discord", label: "Discord", icon: Gamepad2, auth: "webhook",
    fields: [
      { key: "apiKey", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/..." },
    ],
  },
  {
    id: "slack", label: "Slack", icon: Hash, auth: "webhook",
    fields: [
      { key: "apiKey", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/..." },
    ],
  },
  {
    id: "vk", label: "VK", icon: Users, auth: "apikey",
    fields: [
      { key: "apiKey", label: "Access token", placeholder: "Your VK access token", type: "password" },
      { key: "username", label: "Display name", placeholder: "Your name" },
    ],
  },
  {
    id: "nostr", label: "Nostr", icon: Zap, auth: "credentials",
    fields: [
      { key: "apiKey", label: "Private key (nsec)", placeholder: "nsec1...", type: "password" },
      { key: "username", label: "Relay URL", placeholder: "wss://relay.damus.io" },
    ],
  },
  {
    id: "farcaster", label: "Farcaster", icon: Rss, auth: "apikey",
    fields: [
      { key: "apiKey", label: "Signer UUID (Neynar)", placeholder: "uuid...", type: "password" },
      { key: "username", label: "Username", placeholder: "@yourname" },
    ],
  },
  {
    id: "lemmy", label: "Lemmy", icon: MessageCircle, auth: "credentials",
    fields: [
      { key: "instanceUrl", label: "Instance URL", placeholder: "https://lemmy.ml" },
      { key: "username", label: "Username", placeholder: "yourname" },
      { key: "apiKey", label: "Password", placeholder: "Your password", type: "password" },
    ],
  },
  {
    id: "kick", label: "Kick", icon: Gamepad2, auth: "apikey",
    fields: [
      { key: "apiKey", label: "API token", placeholder: "Your API token", type: "password" },
      { key: "username", label: "Username", placeholder: "yourname" },
    ],
  },
  {
    id: "mewe", label: "MeWe", icon: Users, auth: "apikey",
    fields: [
      { key: "apiKey", label: "API token", placeholder: "Your API token", type: "password" },
      { key: "username", label: "Display name", placeholder: "Your name" },
    ],
  },
  {
    id: "skool", label: "Skool", icon: Users, auth: "apikey",
    fields: [
      { key: "apiKey", label: "API token", placeholder: "Your API token", type: "password" },
      { key: "username", label: "Username", placeholder: "yourname" },
    ],
  },
]

const blogProviders: ProviderDef[] = [
  {
    id: "medium", label: "Medium", icon: Pen, auth: "apikey",
    fields: [
      { key: "apiKey", label: "Integration token", placeholder: "Your Medium integration token", type: "password" },
    ],
  },
  {
    id: "devto", label: "Dev.to", icon: Code, auth: "apikey",
    fields: [
      { key: "apiKey", label: "API key", placeholder: "Your Dev.to API key", type: "password" },
    ],
  },
  {
    id: "hashnode", label: "Hashnode", icon: BookOpen, auth: "apikey",
    fields: [
      { key: "apiKey", label: "Personal access token", placeholder: "Your Hashnode token", type: "password" },
    ],
  },
  {
    id: "wordpress", label: "WordPress", icon: FileText, auth: "credentials",
    fields: [
      { key: "instanceUrl", label: "Site URL", placeholder: "https://yourblog.com" },
      { key: "username", label: "Username", placeholder: "admin" },
      { key: "apiKey", label: "Application password", placeholder: "xxxx xxxx xxxx xxxx", type: "password" },
    ],
  },
]

// ── Component ───────────────────────────────────────────────────────────────

export function ConnectAccountButton() {
  const [connectSheet, setConnectSheet] = useState<ProviderDef | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const handleOAuthConnect = (providerId: string) => {
    window.location.href = `/api/social/callback/${providerId}?action=connect`
  }

  const handleApiKeyConnect = async () => {
    if (!connectSheet) return
    setSaving(true)

    try {
      const res = await fetch("/api/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: connectSheet.id,
          apiKey: formData.apiKey || "",
          username: formData.username || "",
          instanceUrl: formData.instanceUrl || "",
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`${connectSheet.label} connected`)
        setConnectSheet(null)
        window.location.reload()
      } else {
        toast.error(data.error || "Connection failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Connection failed")
    } finally {
      setSaving(false)
    }
  }

  const openApiKeySheet = (provider: ProviderDef) => {
    setFormData({})
    setConnectSheet(provider)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden md:block">Connect</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel>Social</DropdownMenuLabel>
          {oauthProviders.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => handleOAuthConnect(p.id)}>
              <p.icon className="h-4 w-4" />
              {p.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>API key / Token</DropdownMenuLabel>
          {apiKeyProviders.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => openApiKeySheet(p)}>
              <p.icon className="h-4 w-4" />
              {p.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Blog / CMS</DropdownMenuLabel>
          {blogProviders.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => openApiKeySheet(p)}>
              <p.icon className="h-4 w-4" />
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* API key / credentials connection sheet */}
      <Sheet open={!!connectSheet} onOpenChange={(open) => !open && setConnectSheet(null)}>
        <SheetContent side="right" className="inset-y-auto top-1/2 -translate-y-1/2 right-4 h-[96vh] rounded-lg w-[95vw] sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Connect {connectSheet?.label}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to connect {connectSheet?.label}.
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {connectSheet?.fields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || "text"}
                  value={formData[field.key] || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
          <SheetFooter className="px-6 py-4 shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button onClick={handleApiKeyConnect} disabled={saving} className="flex-1">
                {saving ? "Connecting..." : "Connect"}
              </Button>
              <Button variant="secondary" onClick={() => setConnectSheet(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

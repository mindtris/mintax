import { z } from "zod"

export const SOCIAL_PROVIDERS = [
  // Social — OAuth
  "twitter", "linkedin", "facebook", "instagram", "tiktok", "youtube",
  "pinterest", "reddit", "threads", "gmb", "dribbble", "twitch",
  // Social — API key / webhook
  "bluesky", "mastodon", "discord", "telegram", "slack",
  "nostr", "farcaster", "vk", "lemmy", "kick", "mewe", "skool",
  // Blog
  "medium", "devto", "hashnode", "wordpress",
] as const

export const CONTENT_TYPES = ["post", "article", "newsletter", "page", "thread"] as const
export const POST_STATUSES = ["draft", "queued", "publishing", "published", "error"] as const
export const MEDIA_TYPES = ["image", "video", "gif"] as const

export const socialPostFormSchema = z.object({
  content: z.string().min(1, "Content is required").max(50000),
  contentType: z.enum(CONTENT_TYPES).default("post"),
  title: z.string().max(500).optional().nullable(),
  excerpt: z.string().max(1000).optional().nullable(),
  slug: z.string().max(200).optional().nullable(),
  tags: z.array(z.string()).default([]),
  socialAccountIds: z.array(z.string().uuid()).min(1, "Select at least one account"),
  scheduledAt: z.union([z.date(), z.string().datetime()]).optional().nullable(),
  status: z.enum(["draft", "queued"]).default("draft"),
  settings: z.record(z.any()).optional(),
})

export const contentTemplateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  content: z.string().min(1, "Content is required").max(50000),
  category: z.string().max(100).optional().nullable(),
  platforms: z.array(z.string()).default([]),
})

export type SocialPostFormData = z.infer<typeof socialPostFormSchema>
export type ContentTemplateFormData = z.infer<typeof contentTemplateFormSchema>

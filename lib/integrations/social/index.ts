import config from "@/lib/core/config"
import { SocialProvider } from "./types"

// ── Provider imports ────────────────────────────────────────────────────────

import { TwitterProvider } from "./twitter"
import { LinkedInProvider } from "./linkedin"
import { FacebookProvider } from "./facebook"
import { InstagramProvider } from "./instagram"
import { TikTokProvider } from "./tiktok"
import { YouTubeProvider } from "./youtube"
import { PinterestProvider } from "./pinterest"
import { RedditProvider } from "./reddit"
import { ThreadsProvider } from "./threads"
import { GoogleMyBusinessProvider } from "./gmb"
import { BlueskyProvider } from "./bluesky"
import { MastodonProvider } from "./mastodon"
import { MediumProvider } from "./medium"
import { DevToProvider } from "./devto"
import { HashnodeProvider } from "./hashnode"
import { WordPressProvider } from "./wordpress"
import { DiscordProvider } from "./discord"
import { TelegramProvider } from "./telegram"
import { SlackProvider } from "./slack"
import { DribbbleProvider } from "./dribbble"
import { NostrProvider } from "./nostr"
import { TwitchProvider, LemmyProvider, VKProvider, FarcasterProvider, KickProvider, MeWeProvider, SkoolProvider } from "./niche-providers"

// ── Registry ────────────────────────────────────────────────────────────────

const providers: Record<string, SocialProvider> = {}

export function registerProvider(provider: SocialProvider) {
  providers[provider.identifier] = provider
}

export function getProvider(identifier: string): SocialProvider {
  const p = providers[identifier]
  if (!p) throw new Error(`Unknown social provider: ${identifier}`)
  return p
}

export function getAllProviders(): SocialProvider[] {
  return Object.values(providers)
}

/** Returns only providers that have credentials configured or don't require them */
export function getAvailableProviders(): SocialProvider[] {
  return Object.values(providers).filter((p) => {
    switch (p.identifier) {
      case "twitter":
        return !!config.social.twitter.clientId
      case "linkedin":
        return !!config.social.linkedin.clientId
      case "facebook":
      case "instagram":
      case "threads":
        return !!config.social.facebook.appId
      case "tiktok":
        return !!(config.social as any).tiktok?.clientKey
      case "youtube":
      case "gmb":
        return !!(config.social as any).google?.clientId
      case "pinterest":
        return !!(config.social as any).pinterest?.clientId
      case "reddit":
        return !!(config.social as any).reddit?.clientId
      case "dribbble":
        return !!(config.social as any).dribbble?.clientId
      case "twitch":
        return !!(config.social as any).twitch?.clientId
      default:
        // Non-OAuth providers (API key, webhook, etc.) are always available
        return !p.requiresOAuth
    }
  })
}

export function getProvidersByCategory(category: SocialProvider["category"]): SocialProvider[] {
  return Object.values(providers).filter((p) => p.category === category)
}

// ── Auto-register all providers ─────────────────────────────────────────────

// Social — OAuth
registerProvider(new TwitterProvider())
registerProvider(new LinkedInProvider())
registerProvider(new FacebookProvider())
registerProvider(new InstagramProvider())
registerProvider(new TikTokProvider())
registerProvider(new YouTubeProvider())
registerProvider(new PinterestProvider())
registerProvider(new RedditProvider())
registerProvider(new ThreadsProvider())
registerProvider(new GoogleMyBusinessProvider())
registerProvider(new DribbbleProvider())
registerProvider(new TwitchProvider())

// Social — API key / webhook
registerProvider(new BlueskyProvider())
registerProvider(new MastodonProvider())
registerProvider(new DiscordProvider())
registerProvider(new TelegramProvider())
registerProvider(new SlackProvider())
registerProvider(new NostrProvider())
registerProvider(new FarcasterProvider())
registerProvider(new VKProvider())
registerProvider(new LemmyProvider())
registerProvider(new KickProvider())
registerProvider(new MeWeProvider())
registerProvider(new SkoolProvider())

// Blog
registerProvider(new MediumProvider())
registerProvider(new DevToProvider())
registerProvider(new HashnodeProvider())
registerProvider(new WordPressProvider())

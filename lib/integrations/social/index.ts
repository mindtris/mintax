import config from "@/lib/core/config"
import { SocialProvider } from "./types"
import { TwitterProvider } from "./twitter"
import { LinkedInProvider } from "./linkedin"
import { FacebookProvider } from "./facebook"
import { InstagramProvider } from "./instagram"

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

/** Returns only providers that have credentials configured */
export function getAvailableProviders(): SocialProvider[] {
  return Object.values(providers).filter((p) => {
    switch (p.identifier) {
      case "twitter":
        return !!config.social.twitter.clientId
      case "linkedin":
        return !!config.social.linkedin.clientId
      case "facebook":
      case "instagram":
        return !!config.social.facebook.appId
      default:
        // Custom/self-hosted providers are always available
        return !p.requiresOAuth
    }
  })
}

export function getProvidersByCategory(category: SocialProvider["category"]): SocialProvider[] {
  return Object.values(providers).filter((p) => p.category === category)
}

// Auto-register providers
registerProvider(new TwitterProvider())
registerProvider(new LinkedInProvider())
registerProvider(new FacebookProvider())
registerProvider(new InstagramProvider())

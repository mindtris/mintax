import { SubscriptionExpired } from "@/components/auth/subscription-expired"
import ScreenDropArea from "@/components/files/screen-drop-area"
import { TopNav } from "@/components/header/top-nav"
import { Toaster } from "@/components/ui/sonner"
import { getActiveOrg, getCurrentUser, isSubscriptionExpired } from "@/lib/core/auth"
import config from "@/lib/core/config"
import { getOrganizationsForUser } from "@/lib/services/organizations"
import { getUnsortedFilesCount } from "@/lib/services/files"
import type { Metadata, Viewport } from "next"
import "../globals.css"
import { NotificationProvider } from "./context"
import { MicrosoftGraphProvider } from "@/lib/integrations/microsoft-graph-provider"

export const metadata: Metadata = {
  title: {
    template: "%s | Mintax",
    default: config.app.title,
  },
  description: config.app.description,
  icons: {
    icon: "/logo/logo.svg",
    shortcut: "/logo/logo.svg",
    apple: "/logo/logo.svg",
  },
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const activeOrg = await getActiveOrg(user)
  const organizations = await getOrganizationsForUser(user.id)
  const unsortedFilesCount = await getUnsortedFilesCount(activeOrg.id)

  const userProfile = {
    id: user.id,
    name: user.name || "",
    email: user.email,
    avatar: user.avatar ? user.avatar + "?" + user.id : undefined,
    membershipPlan: user.membershipPlan || "unlimited",
    storageUsed: user.storageUsed || 0,
    storageLimit: user.storageLimit || -1,
    aiBalance: user.aiBalance || 0,
  }

  return (
    <NotificationProvider>
      <ScreenDropArea>
        <div className="min-h-svh flex flex-col">
          <TopNav
            profile={userProfile}
            unsortedFilesCount={unsortedFilesCount}
            activeOrg={activeOrg}
            organizations={organizations}
          />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {isSubscriptionExpired(user) && <SubscriptionExpired />}
            {children}
          </main>
        </div>
        <Toaster />
      </ScreenDropArea>
    </NotificationProvider>
  )
}

export const dynamic = "force-dynamic"

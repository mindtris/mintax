"use client"

import { Providers } from "@microsoft/mgt-element"
import { Msal2Provider } from "@microsoft/mgt-msal2-provider"
import { useEffect, useState } from "react"
import config from "@/lib/core/config"

export function MicrosoftGraphProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && !Providers.globalProvider) {
      const clientId = config.microsoft.clientId

      if (clientId) {
        Providers.globalProvider = new Msal2Provider({
          clientId,
          scopes: [
            "user.read",
            "mail.read",
            "mail.send",
            "mail.readwrite",
            "contacts.read",
            "calendars.read",
          ],
        })
        console.log("[MGT] Provider initialized with clientId:", clientId)
      } else {
        console.warn("[MGT] Microsoft Client ID is missing. Integration will be disabled.")
      }
      setIsInitialized(true)
    } else {
      setIsInitialized(true)
    }
  }, [])

  if (!isInitialized) {
    return null // or a loader
  }

  return <>{children}</>
}

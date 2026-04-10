/* eslint-disable */
// @ts-nocheck
"use client"

import { Get, Login, Person } from "@microsoft/mgt-react"
import { Providers, ProviderState } from "@microsoft/mgt-element"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Send, RefreshCw, LogIn } from "lucide-react"

export default function OutlookAppPage() {
  const [providerState, setProviderState] = useState<ProviderState>(
    Providers.globalProvider?.state || ProviderState.Loading
  )

  useEffect(() => {
    const updateState = () => {
      setProviderState(Providers.globalProvider?.state || ProviderState.SignedOut)
    }

    Providers.onProviderUpdated(updateState)
    updateState()

    return () => Providers.removeProviderUpdatedListener(updateState)
  }, [])

  if (providerState === ProviderState.SignedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="bg-primary/10 p-6 rounded-full">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Connect your Outlook</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Bring your professional conversations into Mintax. Send invoices and manage clients directly from your inbox.
          </p>
        </div>
        <Login />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1">Outlook</h1>
          <p className="text-muted-foreground">Manage your Microsoft 365 communications.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                Recent Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Get resource="/me/messages" version="v1.0" max-pages="1">
                <template data-type="default">
                  <div className="divide-y divide-border/50">
                    <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-center gap-4 group">
                      <mgt-person person-query="[[value.from.emailAddress.address]]" view="avatar" show-presence />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold truncate">[[value.from.emailAddress.name]]</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{"[[new Date(value.receivedDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})]]"}</span>
                        </div>
                        <div className="text-sm font-medium text-foreground/90 truncate mr-8 group-hover:text-primary transition-colors">
                          [[value.subject]]
                        </div>
                        <div className="text-xs text-muted-foreground truncate line-clamp-1 italic">
                          [[value.bodyPreview]]
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <template data-type="loading">
                  <div className="p-8 text-center text-muted-foreground space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto opacity-20" />
                    <p>Securing connection to Microsoft...</p>
                  </div>
                </template>
                <template data-type="no-data">
                  <div className="p-12 text-center text-muted-foreground">
                    Your inbox is quiet today.
                  </div>
                </template>
              </Get>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Linked Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Person person-query="me" view="twoLines" show-presence />
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => Providers.globalProvider.logout()}>
                Disconnect Outlook
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* eslint-disable */
// @ts-nocheck
"use client"

import { Get, Login, Person, Agenda } from "@microsoft/mgt-react"
import { Providers, ProviderState } from "@microsoft/mgt-element"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Calendar, Send, RefreshCw, AppWindow, Moon, Sun } from "lucide-react"

export function OutlookApp() {
  const [providerState, setProviderState] = useState<ProviderState>(
    Providers.globalProvider?.state || ProviderState.Loading
  )

  useEffect(() => {
    const updateState = () => {
      setProviderState(Providers.globalProvider?.state || ProviderState.SignedOut)
    }

    Providers.onProviderUpdated(updateState)
    updateState()

    // Map Mintax theme to MGT components
    const isDark = document.documentElement.classList.contains("dark")
    if (Providers.globalProvider) {
      // MGT supports light/dark themes natively
      // We can also force a theme: Providers.globalProvider.theme = isDark ? 'dark' : 'light'
    }

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
            Bring your professional conversations and schedule into Mintax.
          </p>
        </div>
        <Login />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 mgt-mintax-theme">
      <style jsx global>{`
        .mgt-mintax-theme {
          --mg-primary-color: hsl(var(--primary));
          --mg-primary-font-color: hsl(var(--primary-foreground));
          --mg-background-color: transparent;
          --mg-foreground-color: hsl(var(--foreground));
          --mg-font-family: inherit;
          
          /* Borders and Dividers */
          --mg-row-border-color: hsl(var(--border) / 0.5);
          --mg-column-border-color: hsl(var(--border) / 0.5);
          
          /* Interactivity */
          --mg-row-hover-background-color: hsl(var(--accent) / 0.3);
          --mg-active-color: hsl(var(--primary));
          
          /* Agenda / Calendar Specific */
          --mg-agenda-event-box-shadow: none;
          --mg-agenda-event-background-color: hsl(var(--card));
          --mg-agenda-event-border-radius: var(--radius);
        }

        /* Dark mode overrides for MGT internal parts if needed */
        .dark .mgt-mintax-theme {
          --mg-background-color: transparent;
        }

        mgt-agenda {
          --agenda-header-margin: 0 0 20px 0;
          --agenda-event-padding: 12px;
          --agenda-event-margin: 0 0 10px 0;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1 flex items-center gap-3">
            Outlook
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">Connected</span>
          </h1>
          <p className="text-muted-foreground">Manage your Microsoft 365 communications and schedule.</p>
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

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-8">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-6 border-none p-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-lg">Recent Emails</CardTitle>
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
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {"[[new Date(value.receivedDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})]]"}
                              </span>
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
                      <div className="p-12 text-center text-muted-foreground space-y-4">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto opacity-20" />
                        <p>Fetching messages...</p>
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
              <Card className="border-none shadow-sm h-fit">
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
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6 border-none p-0 outline-none">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                Your Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Agenda show-max="10" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

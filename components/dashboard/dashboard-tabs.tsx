"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import {
  BadgeCent,
  BriefcaseBusiness,
  MessageCircleHeart,
  UserRound,
  UsersRound,
  Link as LinkIcon,
  Plus,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function DashboardTabs({
  accountsContent,
  quicklinksContent,
  engageContent,
  customersContent,
  peopleContent,
  hireContent,
  defaultTab,
}: {
  accountsContent: React.ReactNode
  quicklinksContent: React.ReactNode
  engageContent?: React.ReactNode
  customersContent?: React.ReactNode
  peopleContent?: React.ReactNode
  hireContent?: React.ReactNode
  defaultTab?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || defaultTab || "accounts"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "accounts") {
      params.delete("tab")
    } else {
      params.set("tab", value)
    }
    const qs = params.toString()
    router.push(`/dashboard${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="accounts">
          <BadgeCent className="h-4 w-4" />
          Accounts
        </TabsTrigger>
        <TabsTrigger value="people">
          <UserRound className="h-4 w-4" />
          People
        </TabsTrigger>
        <TabsTrigger value="hire">
          <BriefcaseBusiness className="h-4 w-4" />
          Hire
        </TabsTrigger>
        <TabsTrigger value="customers">
          <UsersRound className="h-4 w-4" />
          Customers
        </TabsTrigger>
        <TabsTrigger value="engage">
          <MessageCircleHeart className="h-4 w-4" />
          Engage
        </TabsTrigger>
        <TabsTrigger value="quicklinks">
          <LinkIcon className="h-4 w-4" />
          Quicklinks
        </TabsTrigger>
      </TabsList>

      <TabsContent value="accounts">
        {accountsContent}
      </TabsContent>

      <TabsContent value="people" className="mt-6">
        {peopleContent || (
          <PlaceholderTab
            label="People"
            title="Available People"
            btnLabel="Add Person"
            description="Employee records, reminders, time off, and onboarding."
          />
        )}
      </TabsContent>

      <TabsContent value="hire" className="mt-6">
        {hireContent || (
          <PlaceholderTab
            label="Hire"
            title="Available Roles"
            btnLabel="Add Job"
            description="Job postings, candidates, pipeline, and offers."
          />
        )}
      </TabsContent>

      <TabsContent value="customers" className="mt-6">
        {customersContent || (
          <PlaceholderTab
            label="Customers"
            title="Available Customers"
            btnLabel="Add Customer"
            description="Vendors, clients, contracts, and relationship tracking."
          />
        )}
      </TabsContent>

      <TabsContent value="engage" className="mt-6">
        {engageContent || (
          <PlaceholderTab
            label="Engage"
            title="Available Content"
            btnLabel="Add Campaign"
            description="Social media, content scheduling, and employer branding."
          />
        )}
      </TabsContent>

      <TabsContent value="quicklinks" className="mt-6">
        {quicklinksContent}
      </TabsContent>
    </Tabs>
  )
}

function PlaceholderTab({ label, description, title, btnLabel }: { label: string; description: string; title: string; btnLabel: string }) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> {btnLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Add manual {label.toLowerCase()}</DropdownMenuItem>
            <DropdownMenuItem>Import {label.toLowerCase()}</DropdownMenuItem>
            <DropdownMenuItem>View settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EmptyState
        title={label}
        description={description}
      />
    </div>
  )
}

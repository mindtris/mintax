import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getBenchResources } from "@/lib/services/candidates"
import { listContacts } from "@/lib/services/contacts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Send, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Briefcase
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DownloadProfileButton } from "@/components/hire/bench/download-profile-button"
import { SubmitToClientModal } from "@/components/hire/bench/submit-to-client-modal"
import { getContentTemplates } from "@/lib/services/content-templates"

export default async function BenchPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const [resources, clients, templates] = await Promise.all([
    getBenchResources(org.id),
    listContacts(org.id, { type: "client" }),
    getContentTemplates(org.id)
  ])

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Internal bench</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage and market your internal resources to find job leads.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Marketing reports
          </Button>
          <Link href="/hire/candidates?group=BENCH">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add to bench
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {resources.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center bg-muted/20 border border-dashed border-black/10 rounded-3xl">
              <Users className="w-8 h-8 text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg">No resources on bench</h3>
              <p className="text-muted-foreground text-sm max-w-sm text-center mt-1">
                Add your internal consultants to the bench to start marketing them to clients.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((res: any) => (
                <ResourceCard 
                  key={res.id} 
                  resource={res} 
                  organization={org} 
                  contacts={clients}
                  templates={templates}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary/[0.02] border-l-4 border-l-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="w-4 h-4" />
                Active marketing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground italic">
                Recent submissions to clients and partners...
              </div>
              {/* This would be a feed of MarketingSubmission records */}
              <div className="space-y-3">
                {resources.flatMap(r => r.submissions).slice(0, 5).map((sub: any) => (
                  <div key={sub.id} className="text-sm p-3 bg-white rounded-xl border border-black/[0.03] shadow-sm">
                    <div className="font-bold">{sub.candidate.firstName} {sub.candidate.lastName}</div>
                    <div className="text-muted-foreground text-[10px] mt-1 italic leading-tight">
                      Sent to <span className="text-foreground font-medium">{sub.contact.name}</span> on {new Date(sub.sentAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ResourceCard({ resource, organization, contacts, templates }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                  {resource.firstName[0]}{resource.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold text-base leading-tight">
                  {resource.firstName} {resource.lastName}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 font-bold">
                  {resource.benchStatus === "available" ? "Ready for placement" : resource.benchStatus}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase py-0.5">
              ${resource.hourlyRate || "---"}/hr
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
            {resource.marketingBio || "No marketing bio provided."}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/[0.03]">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submissions</span>
                <span className="text-xs font-bold">{resource.submissions.length}</span>
              </div>
               <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available</span>
                <span className="text-xs font-bold whitespace-nowrap">
                   {resource.availabilityDate ? new Date(resource.availabilityDate).toLocaleDateString() : "Now"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <DownloadProfileButton 
                candidate={resource} 
                organization={organization} 
                className="opacity-0 group-hover:opacity-100" 
              />
              <SubmitToClientModal
                candidate={resource}
                organization={organization}
                contacts={contacts}
                templates={templates}
              >
                <Button size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Send className="w-3 h-3 mr-1.5" />
                  Submit
                </Button>
              </SubmitToClientModal>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

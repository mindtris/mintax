import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCandidates } from "@/lib/services/candidates"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NewCandidateSheet } from "@/components/hire/new-candidate-sheet"
import {
  Users,
  Search,
  FileText,
  Linkedin,
  Mail,
  ChevronRight,
  ChevronLeft,
  Plus,
} from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Candidate directory | Hire",
}

export default async function CandidatesPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const candidates = await getCandidates(org.id)

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hire">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Candidate hub</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Centralized directory of all applicants and sourced talent.</p>
          </div>
        </div>
        <NewCandidateSheet>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add candidate
          </Button>
        </NewCandidateSheet>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.05] shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-black/[0.03] flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or skills..."
              className="w-full bg-white border border-black/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            />
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{candidates.length} profiles</p>
        </div>

        {candidates.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Users className="w-8 h-8 text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg">No candidates yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">Start by adding candidates manually or posting a job.</p>
            <NewCandidateSheet>
              <Button className="mt-6 px-8 rounded-xl">Add first candidate</Button>
            </NewCandidateSheet>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/[0.01] border-b border-black/[0.03]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                   <th className="px-6 py-4 text-left">Candidate</th>
                   <th className="px-6 py-4 text-left">Group</th>
                   <th className="px-6 py-4 text-left">Contact</th>
                   <th className="px-6 py-4 text-left">Placement / Job</th>
                   <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {candidates.map((c: any) => (
                  <tr key={c.id} className="hover:bg-black/[0.01] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </td>
                      <div className="flex flex-col gap-1">
                        <Badge variant={c.group === "BENCH" ? "secondary" : "outline"} className="w-fit text-[10px] font-bold">
                          {c.group}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground italic">{c.sourcedFrom || "Organic"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-1">
                        {c.email && (
                          <a href={`mailto:${c.email}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary">
                              <Mail className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {c.linkedinUrl && (
                          <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary">
                              <Linkedin className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {c.job ? (
                        <Link href={`/hire/${c.jobId}/applicants`}>
                          <Badge className="bg-primary/5 text-primary hover:bg-primary/10 transition-all cursor-pointer border-none rounded-md px-2 py-0.5 text-[10px] font-bold">
                            {c.job.title}
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{c.group === "BENCH" ? "Internal Placement" : "General Pool"}</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <Badge className="rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-black/5 text-black border-none">
                          {c.status}
                        </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

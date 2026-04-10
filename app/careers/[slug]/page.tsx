import { prisma } from "@/lib/core/db"
import config from "@/lib/core/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, MapPin, Clock, DollarSign } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const org = await prisma.organization.findUnique({ where: { slug } })
  if (!org) return { title: "Careers" }
  return {
    title: `Careers at ${org.name}`,
    description: `Explore open positions at ${org.name}`,
  }
}

export default async function CareersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      jobPostings: {
        where: { status: "open" },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!org) notFound()

  const baseUrl = config.app.baseURL

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-black/[0.05] py-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3">
            {org.logo && <img src={org.logo} alt={org.name} className="h-10 w-10 rounded-lg" />}
            <div>
              <h1 className="text-2xl font-bold tracking-tighter">{org.name}</h1>
              <p className="text-sm text-muted-foreground">Open positions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {org.jobPostings.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">No open positions</h2>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {org.jobPostings.map((job) => (
              <Link key={job.id} href={`/careers/${slug}/${job.id}`}>
                <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{job.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#141413]">
                          {job.category && (
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: job.category.color }} />
                              {job.category.name}
                            </span>
                          )}
                          <span className="capitalize">{job.type}</span>
                          {job.experienceMin != null && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {job.experienceMin}-{job.experienceMax} yrs
                            </span>
                          )}
                          {job.salaryMin && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {(job.salaryMin / 1000).toFixed(0)}k-{(job.salaryMax! / 1000).toFixed(0)}k {job.currency}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium capitalize shrink-0">
                      {job.type}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-black/[0.05] py-4 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground">Powered by {config.app.title}</p>
        </div>
      </footer>

      {/* JSON-LD for Google Jobs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: org.jobPostings.map((job, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${baseUrl}/careers/${slug}/${job.id}`,
            })),
          }),
        }}
      />
    </div>
  )
}

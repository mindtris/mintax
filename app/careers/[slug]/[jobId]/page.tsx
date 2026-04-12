import { prisma } from "@/lib/core/db"
import config from "@/lib/core/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, ChevronLeft, Clock, DollarSign, MapPin } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; jobId: string }> }): Promise<Metadata> {
  const { slug, jobId } = await params
  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId },
    include: { organization: true },
  })
  if (!job) return { title: "Job" }
  return {
    title: `${job.title} at ${job.organization.name}`,
    description: job.description?.slice(0, 160) || `${job.title} - ${job.type} position at ${job.organization.name}`,
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string; jobId: string }> }) {
  const { slug, jobId } = await params

  const org = await prisma.organization.findUnique({ where: { slug } })
  if (!org) notFound()

  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, organizationId: org.id, status: "open" },
    include: { category: true },
  })
  if (!job) notFound()

  const baseUrl = config.app.baseURL
  const jobUrl = `${baseUrl}/careers/${slug}/${job.id}`

  // Google Jobs JSON-LD
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    datePosted: job.createdAt.toISOString().split("T")[0],
    hiringOrganization: {
      "@type": "Organization",
      name: org.name,
      sameAs: org.website || baseUrl,
      ...(org.logo ? { logo: org.logo } : {}),
    },
    ...(org.address ? {
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          streetAddress: org.address,
        },
      },
    } : {
      jobLocationType: "TELECOMMUTE",
    }),
    employmentType: job.type === "permanent" ? "FULL_TIME"
      : job.type === "contract" ? "CONTRACTOR"
      : job.type === "freelance" ? "OTHER"
      : "FULL_TIME",
    ...(job.salaryMin && job.salaryMax ? {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: job.currency,
        value: {
          "@type": "QuantitativeValue",
          minValue: job.salaryMin,
          maxValue: job.salaryMax,
          unitText: "YEAR",
        },
      },
    } : {}),
    url: jobUrl,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-black/[0.05] py-6">
        <div className="max-w-3xl mx-auto px-6">
          <Link href={`/careers/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" />
            All positions
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter">{job.title}</h1>
              <p className="text-sm text-muted-foreground">{org.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs capitalize">{job.type}</Badge>
          {job.category && (
            <Badge variant="outline" className="text-xs">
              <div className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: job.category.color }} />
              {job.category.name}
            </Badge>
          )}
          {job.experienceMin != null && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {job.experienceMin}-{job.experienceMax} years
            </Badge>
          )}
          {job.salaryMin && (
            <Badge variant="outline" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              {(job.salaryMin / 1000).toFixed(0)}k-{(job.salaryMax! / 1000).toFixed(0)}k {job.currency}
            </Badge>
          )}
          {org.address && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {org.address}
            </Badge>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              <h2 className="text-sm font-semibold mb-3">Description</h2>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{job.description}</div>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {job.requirements && (
          <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              <h2 className="text-sm font-semibold mb-3">Requirements</h2>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{job.requirements}</div>
            </CardContent>
          </Card>
        )}

        {/* Apply CTA */}
        <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
          <CardContent className="py-6 text-center">
            <h2 className="text-sm font-semibold mb-2">Interested in this role?</h2>
            <p className="text-xs text-[#141413] mb-4">Send your resume to apply for this position.</p>
            {org.phone && (
              <a href={`mailto:${org.phone}`}>
                <Button>Apply now</Button>
              </a>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-black/[0.05] py-4 mt-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground">Powered by Mindtris ({config.app.title})</p>
        </div>
      </footer>

      {/* Google Jobs structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}

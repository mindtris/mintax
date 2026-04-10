import { prisma } from "@/lib/core/db"
import config from "@/lib/core/config"
import { NextRequest, NextResponse } from "next/server"

// GET /api/jobs/feed?org=<slug>
// XML job feed compatible with Google Jobs, Jora, Trovit, Jobrapido, etc.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("org")
  if (!slug) {
    return new NextResponse("Missing org parameter", { status: 400 })
  }

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

  if (!org) {
    return new NextResponse("Organization not found", { status: 404 })
  }

  const baseUrl = config.app.baseURL
  const now = new Date().toISOString()

  const jobItems = org.jobPostings.map((job) => {
    const jobUrl = `${baseUrl}/careers/${org.slug}/${job.id}`
    const salary = job.salaryMin && job.salaryMax
      ? `${job.currency} ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k`
      : ""

    return `
    <item>
      <title><![CDATA[${job.title}]]></title>
      <link>${jobUrl}</link>
      <guid isPermaLink="true">${jobUrl}</guid>
      <description><![CDATA[${(job.description || "").replace(/[<>]/g, "")}]]></description>
      <pubDate>${new Date(job.createdAt).toUTCString()}</pubDate>
      <category><![CDATA[${job.category?.name || "General"}]]></category>
      ${job.type ? `<type>${job.type}</type>` : ""}
      ${salary ? `<salary>${salary}</salary>` : ""}
      ${org.address ? `<location><![CDATA[${org.address}]]></location>` : ""}
      <company><![CDATA[${org.name}]]></company>
    </item>`
  }).join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${org.name} - Open Positions</title>
    <link>${baseUrl}/careers/${org.slug}</link>
    <description>Job openings at ${org.name}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/api/jobs/feed?org=${org.slug}" rel="self" type="application/rss+xml" />
    ${jobItems}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}

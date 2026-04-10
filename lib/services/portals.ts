import { prisma } from "@/lib/core/db"
import { getJobPosting } from "./jobs"

/**
 * Publishes a Job Posting to a social portal (e.g. LinkedIn, Twitter)
 * by creating a SocialPost linked to the job.
 */
export async function publishJobToPortal(
  organizationId: string, 
  jobId: string, 
  socialAccountId: string,
  createdById: string
) {
  const job = await getJobPosting(jobId)
  if (!job) throw new Error("Job not found")

  // Map Ceipal Job Fields to Social Post Content
  const salaryRange = job.salaryMin ? `(${job.currency} ${(job.salaryMin/1000).toFixed(0)}k - ${(job.salaryMax!/1000).toFixed(0)}k)` : ""
  const jobLink = `${process.env.NEXT_PUBLIC_APP_URL}/hire/apply/${job.id}`
  
  const content = `🚀 WE ARE HIRING: ${job.title} ${salaryRange}\n\n${job.description?.slice(0, 150)}...\n\nApply here: ${jobLink}\n\n#hiring #recruitment #jobs #${job.jobCategoryCode || 'career'}`

  return await prisma.socialPost.create({
    data: {
      organizationId,
      socialAccountId,
      createdById,
      contentType: "job_post",
      title: `Job Post: ${job.title}`,
      content,
      status: "queued",
      scheduledAt: new Date(),
    }
  })
}

export async function getRecruiterSocialAccounts(organizationId: string) {
  // We can filter for specific recruitment-linked accounts if needed, 
  // currently we return all connected engage accounts for the organization.
  return await prisma.socialAccount.findMany({
    where: { 
      organizationId,
      disabled: false
    }
  })
}

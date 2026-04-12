import { prisma } from "@/lib/core/db"
import { EmailTemplate } from "@/lib/prisma/client"

/**
 * Fetch the active email template for a specific organization, module, and event.
 * Falls back to finding the first available if no default is set.
 */
export async function getEmailTemplate(
  orgId: string,
  module: string,
  event: string
): Promise<EmailTemplate | null> {
  return await prisma.emailTemplate.findFirst({
    where: {
      organizationId: orgId,
      module,
      event,
      isActive: true,
    },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  })
}

/**
 * Get all templates for an organization
 */
export async function getOrgEmailTemplates(orgId: string) {
  return await prisma.emailTemplate.findMany({
    where: { organizationId: orgId },
    orderBy: { module: "asc" },
  })
}

/**
 * Interpolate variables in template strings
 */
export function interpolate(text: string | null, vars: Record<string, any>): string {
  if (!text) return ""
  return Object.entries(vars).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value ?? ""))
  }, text)
}

/**
 * Create or update a template
 */
export async function upsertEmailTemplate(orgId: string, data: Partial<EmailTemplate>) {
  if (data.id) {
    // If setting as default, unset others first
    if (data.isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { organizationId: orgId, module: data.module, event: data.event },
        data: { isDefault: false },
      })
    }
    return await prisma.emailTemplate.update({
      where: { id: data.id },
      data: {
        ...data,
        organizationId: orgId,
      },
    })
  }

  // Create new
  if (data.isDefault) {
    await prisma.emailTemplate.updateMany({
      where: { organizationId: orgId, module: data.module, event: data.event },
      data: { isDefault: false },
    })
  }
  
  return await prisma.emailTemplate.create({
    data: {
      organizationId: orgId,
      module: data.module!,
      event: data.event!,
      name: data.name!,
      subject: data.subject || "No Subject",
      body: data.body || "",
      greeting: data.greeting || null,
      footer: data.footer || null,
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
    },
  })
}

/**
 * Delete a template
 */
export async function deleteEmailTemplate(id: string, orgId: string) {
  return await prisma.emailTemplate.delete({
    where: { id, organizationId: orgId },
  })
}

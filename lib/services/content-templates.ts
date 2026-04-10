import { prisma } from "@/lib/core/db"
import { cache } from "react"

export const getContentTemplates = cache(async (orgId: string) => {
  return await prisma.contentTemplate.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  })
})

export const getContentTemplateById = cache(async (id: string, orgId: string) => {
  return await prisma.contentTemplate.findFirst({
    where: { id, organizationId: orgId },
  })
})

export const getContentTemplatesByPlatform = cache(async (orgId: string, platform: string) => {
  return await prisma.contentTemplate.findMany({
    where: {
      organizationId: orgId,
      platforms: { has: platform },
    },
    orderBy: { name: "asc" },
  })
})

export async function createContentTemplate(
  orgId: string,
  userId: string,
  data: {
    name: string
    content: string
    category?: string
    platforms?: string[]
  }
) {
  return await prisma.contentTemplate.create({
    data: {
      organizationId: orgId,
      createdById: userId,
      name: data.name,
      content: data.content,
      category: data.category,
      platforms: data.platforms || [],
    },
  })
}

export async function updateContentTemplate(
  id: string,
  orgId: string,
  data: {
    name?: string
    content?: string
    category?: string
    platforms?: string[]
  }
) {
  return await prisma.contentTemplate.update({
    where: { id, organizationId: orgId },
    data,
  })
}

export async function deleteContentTemplate(id: string, orgId: string) {
  return await prisma.contentTemplate.delete({
    where: { id, organizationId: orgId },
  })
}

/**
 * Resolves placeholders in a template string using a provided data object.
 * Example: resolveTemplate("Hi {{name}}", { name: "John" }) => "Hi John"
 */
export function resolveTemplate(template: string, data: Record<string, string | number | null | undefined>) {
  let resolved = template
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "g")
    resolved = resolved.replace(placeholder, String(value || ""))
  })
  return resolved
}

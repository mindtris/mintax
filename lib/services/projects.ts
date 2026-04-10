import { prisma } from "@/lib/core/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@/lib/prisma/client"
import { cache } from "react"

export type ProjectData = {
  [key: string]: unknown
}

export const getProjects = cache(async (orgId: string) => {
  return await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: {
      name: "asc",
    },
  })
})

export const getProjectByCode = cache(async (orgId: string, code: string) => {
  return await prisma.project.findUnique({
    where: { organizationId_code: { code, organizationId: orgId } },
  })
})

export const createProject = async (orgId: string, project: ProjectData) => {
  if (!project.code) {
    project.code = codeFromName(project.name as string)
  }
  return await prisma.project.create({
    data: {
      ...project,
      organization: {
        connect: {
          id: orgId,
        },
      },
    } as Prisma.ProjectCreateInput,
  })
}

export const updateProject = async (orgId: string, code: string, project: ProjectData) => {
  return await prisma.project.update({
    where: { organizationId_code: { code, organizationId: orgId } },
    data: project,
  })
}

export const deleteProject = async (orgId: string, code: string) => {
  await prisma.transaction.updateMany({
    where: {
      organizationId: orgId,
      projectCode: code,
    },
    data: {
      projectCode: null,
    },
  })

  return await prisma.project.delete({
    where: { organizationId_code: { code, organizationId: orgId } },
  })
}

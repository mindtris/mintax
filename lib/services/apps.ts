import { prisma } from "@/lib/core/db"

export const getAppData = async (orgId: string, app: string) => {
  const appData = await prisma.appData.findUnique({
    where: { organizationId_app: { organizationId: orgId, app } },
  })

  return appData?.data
}

export const setAppData = async (orgId: string, app: string, data: any) => {
  await prisma.appData.upsert({
    where: { organizationId_app: { organizationId: orgId, app } },
    update: { data },
    create: { organizationId: orgId, app, data },
  })
}

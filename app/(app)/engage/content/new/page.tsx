import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCategoriesByType } from "@/lib/services/categories"
import { UnifiedEditor } from "@/components/engage/unified-editor"
import { prisma } from "@/lib/core/db"
import { Metadata } from "next"

export const metadata: Metadata = { title: "New post" }

export default async function NewContentPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  
  const [categories, accounts, members] = await Promise.all([
    getCategoriesByType(org.id, "engage"),
    prisma.socialAccount.findMany({
      where: { organizationId: org.id },
      orderBy: { name: "asc" }
    }),
    prisma.orgMember.findMany({
      where: { organizationId: org.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "asc" }
    })
  ])

  return (
    <UnifiedEditor
      categories={categories}
      initialAccounts={accounts}
      orgMembers={members}
    />
  )
}

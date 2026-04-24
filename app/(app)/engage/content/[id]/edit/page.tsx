import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getCategoriesByType } from "@/lib/services/categories"
import { getSocialPostById } from "@/lib/services/social-posts"
import { UnifiedEditor } from "@/components/engage/unified-editor"
import { prisma } from "@/lib/core/db"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Edit post" }

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  
  const [post, categories, accounts, members] = await Promise.all([
    getSocialPostById(id, org.id),
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

  if (!post) notFound()

  return (
    <UnifiedEditor
      categories={categories}
      initialAccounts={accounts}
      orgMembers={members}
      initialPost={post}
    />
  )
}

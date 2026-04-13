import { NextResponse } from "next/server"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { prisma } from "@/lib/core/db"
import { syncPlaidItem } from "@/lib/services/plaid-sync"
import { revalidatePath } from "next/cache"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const item = await prisma.plaidItem.findFirst({
    where: { id, organizationId: org.id },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const result = await syncPlaidItem(id)
    revalidatePath("/accounts")
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Sync failed" },
      { status: 500 }
    )
  }
}

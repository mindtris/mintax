import { NextResponse } from "next/server"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { disconnectPlaidItem } from "@/lib/services/plaid-sync"
import { revalidatePath } from "next/cache"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  try {
    await disconnectPlaidItem(id, org.id)
    revalidatePath("/accounts")
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Disconnect failed" }, { status: 500 })
  }
}

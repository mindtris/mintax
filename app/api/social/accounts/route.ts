import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getActiveSocialAccounts } from "@/lib/services/social-accounts"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const accounts = await getActiveSocialAccounts(org.id)

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        provider: a.provider,
        name: a.name,
        username: a.username,
        picture: a.picture,
      })),
    })
  } catch {
    return NextResponse.json({ accounts: [] })
  }
}

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getAllProviders, getAvailableProviders } from "@/lib/integrations/social"
import { getSocialAccounts } from "@/lib/services/social-accounts"
import { NextResponse } from "next/server"

/** GET /api/v1/integrations — List connected social accounts and available providers */
export async function GET() {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const accounts = await getSocialAccounts(org.id)
    const available = getAvailableProviders()

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        provider: a.provider,
        name: a.name,
        username: a.username,
        picture: a.picture,
        disabled: a.disabled,
        refreshNeeded: a.refreshNeeded,
      })),
      availableProviders: available.map((p) => ({
        identifier: p.identifier,
        name: p.name,
        category: p.category,
        supportedContentTypes: p.supportedContentTypes,
        maxContentLength: p.maxContentLength,
        supportedMediaTypes: p.supportedMediaTypes,
        maxMediaCount: p.maxMediaCount,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

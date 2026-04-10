import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getAccountAnalytics, getPostAnalytics } from "@/lib/services/social-analytics"
import { NextRequest, NextResponse } from "next/server"

/** GET /api/v1/analytics?postId=xxx or ?accountId=xxx&dateFrom=&dateTo= */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const url = new URL(request.url)
    const postId = url.searchParams.get("postId")
    const accountId = url.searchParams.get("accountId") || undefined
    const dateFrom = url.searchParams.get("dateFrom") || undefined
    const dateTo = url.searchParams.get("dateTo") || undefined

    if (postId) {
      const analytics = await getPostAnalytics(postId, org.id)
      return NextResponse.json({ analytics })
    }

    const totals = await getAccountAnalytics(org.id, accountId, dateFrom, dateTo)
    return NextResponse.json({ analytics: totals })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

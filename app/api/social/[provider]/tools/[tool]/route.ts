import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { runSocialTool } from "@/lib/services/social-tools"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string; tool: string }> }
) {
  try {
    const { provider, tool } = await params
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    
    const body = await req.json()
    const { accountId, ...toolParams } = body

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 })
    }

    const result = await runSocialTool(org.id, accountId, tool, toolParams)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Social tool error:", error)
    return NextResponse.json({ error: error.message || "Tool execution failed" }, { status: 500 })
  }
}

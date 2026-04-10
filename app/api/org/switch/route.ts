import { setActiveOrg } from "@/lib/core/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { orgId } = await request.json()

  if (!orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 })
  }

  await setActiveOrg(orgId)

  return NextResponse.json({ success: true })
}

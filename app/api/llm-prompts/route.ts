import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getLlmPromptsByModule } from "@/lib/services/llm-prompts"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const module = request.nextUrl.searchParams.get("module")

    if (!module) {
      return NextResponse.json({ error: "module parameter required" }, { status: 400 })
    }

    const prompts = await getLlmPromptsByModule(org.id, module)

    return NextResponse.json({
      prompts: prompts.map((p) => ({ id: p.id, name: p.name })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 })
  }
}

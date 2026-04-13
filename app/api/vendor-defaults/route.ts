import { NextRequest, NextResponse } from "next/server"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getVendorDefaults } from "@/lib/services/transaction-intelligence"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const contactId = req.nextUrl.searchParams.get("contactId")
    if (!contactId) {
      return NextResponse.json({ error: "contactId is required" }, { status: 400 })
    }

    const defaults = await getVendorDefaults(org.id, contactId)
    return NextResponse.json({ defaults })
  } catch (error: any) {
    console.error("[VENDOR_DEFAULTS_ERROR]", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}

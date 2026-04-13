import { NextResponse } from "next/server"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getPlaidClient, PLAID_COUNTRY_CODES, PLAID_PRODUCTS, isPlaidConfigured } from "@/lib/integrations/plaid"
import config from "@/lib/core/config"

export async function POST() {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured on the server" }, { status: 503 })
  }
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const client = getPlaidClient()

    const res = await client.linkTokenCreate({
      user: { client_user_id: `${org.id}:${user.id}` },
      client_name: "Mintax",
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: "en",
      webhook: `${config.app.baseURL}/api/webhooks/plaid`,
    })

    return NextResponse.json({ linkToken: res.data.link_token })
  } catch (err: any) {
    console.error("plaid link-token error", err?.response?.data || err)
    return NextResponse.json(
      { error: err?.response?.data?.error_message || err?.message || "Failed to create link token" },
      { status: 500 }
    )
  }
}

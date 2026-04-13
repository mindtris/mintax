import { NextResponse } from "next/server"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getPlaidClient, isPlaidConfigured } from "@/lib/integrations/plaid"
import { encryptSecret } from "@/lib/integrations/crypto"
import { linkPlaidAccounts, syncPlaidItem } from "@/lib/services/plaid-sync"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured" }, { status: 503 })
  }
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)
    const { publicToken } = await request.json()
    if (!publicToken) {
      return NextResponse.json({ error: "publicToken required" }, { status: 400 })
    }

    const client = getPlaidClient()
    const exchange = await client.itemPublicTokenExchange({ public_token: publicToken })
    const accessToken = exchange.data.access_token
    const itemId = exchange.data.item_id

    const [accountsRes, itemRes] = await Promise.all([
      client.accountsGet({ access_token: accessToken }),
      client.itemGet({ access_token: accessToken }),
    ])

    let institutionId: string | null = itemRes.data.item.institution_id || null
    let institutionName: string | null = null
    if (institutionId) {
      try {
        const inst = await client.institutionsGetById({
          institution_id: institutionId,
          country_codes: accountsRes.data.accounts[0]?.balances?.iso_currency_code === "CAD"
            ? (["CA"] as any)
            : (["US", "CA", "GB"] as any),
        })
        institutionName = inst.data.institution.name
      } catch {}
    }

    const plaidItem = await linkPlaidAccounts(org.id, {
      itemId,
      accessToken: encryptSecret(accessToken),
      institutionId,
      institutionName,
      accounts: accountsRes.data.accounts.map((a) => ({
        plaidAccountId: a.account_id,
        name: a.name,
        officialName: a.official_name,
        mask: a.mask,
        type: a.type,
        subtype: a.subtype,
        currency: a.balances.iso_currency_code,
        currentBalance: a.balances.current,
      })),
    })

    // Initial sync (best-effort — webhook will catch up if this fails)
    try {
      await syncPlaidItem(plaidItem.id)
    } catch (e) {
      console.error("initial plaid sync failed", e)
    }

    revalidatePath("/accounts")
    return NextResponse.json({ success: true, plaidItemId: plaidItem.id })
  } catch (err: any) {
    console.error("plaid exchange error", err?.response?.data || err)
    return NextResponse.json(
      { error: err?.response?.data?.error_message || err?.message || "Failed to exchange token" },
      { status: 500 }
    )
  }
}

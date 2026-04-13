import { NextResponse } from "next/server"
import { prisma } from "@/lib/core/db"
import { syncPlaidItem } from "@/lib/services/plaid-sync"

/**
 * Plaid webhooks. Verification via JWT (plaid-verification header) is recommended
 * for production; for now we accept and look up by item_id (which is Plaid-issued
 * and unique per row). Add JWT verification before enabling in production.
 */
export async function POST(request: Request) {
  let payload: any
  try {
    payload = await request.json()
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 })
  }

  const { webhook_type, webhook_code, item_id, error } = payload
  if (!item_id) return new NextResponse("Missing item_id", { status: 400 })

  const item = await prisma.plaidItem.findUnique({ where: { itemId: item_id } })
  if (!item) return new NextResponse("Item not found", { status: 404 })

  try {
    if (webhook_type === "TRANSACTIONS") {
      switch (webhook_code) {
        case "SYNC_UPDATES_AVAILABLE":
        case "DEFAULT_UPDATE":
        case "INITIAL_UPDATE":
        case "HISTORICAL_UPDATE":
          await syncPlaidItem(item.id)
          break
      }
    } else if (webhook_type === "ITEM") {
      if (webhook_code === "ERROR" || error?.error_code === "ITEM_LOGIN_REQUIRED") {
        await prisma.plaidItem.update({
          where: { id: item.id },
          data: {
            status: error?.error_code === "ITEM_LOGIN_REQUIRED" ? "login_required" : "error",
            lastError: error?.error_message || webhook_code,
          },
        })
      }
    }
    return new NextResponse("ok", { status: 200 })
  } catch (err: any) {
    console.error("plaid webhook handler error", err)
    return new NextResponse("handler error", { status: 500 })
  }
}

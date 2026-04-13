import { NextResponse } from "next/server"
import { prisma } from "@/lib/core/db"
import { syncPlaidItem } from "@/lib/services/plaid-sync"
import { verifyPlaidWebhook } from "@/lib/integrations/plaid-webhook-verify"

/**
 * Plaid webhooks. Every request is verified via JWT (plaid-verification header).
 * We read the raw body as text so the sha256 check in the JWT payload matches
 * byte-for-byte — do not swap in request.json() above the verify call.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()
  const verificationHeader = request.headers.get("plaid-verification")

  const verified = await verifyPlaidWebhook(rawBody, verificationHeader)
  if (!verified) {
    return new NextResponse("Invalid signature", { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
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

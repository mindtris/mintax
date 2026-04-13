import { getSession } from "@/lib/core/auth"
import { getFxRate } from "@/lib/services/fx"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const dateParam = searchParams.get("date")

  if (!from || !to || !dateParam) {
    return NextResponse.json({ error: "Missing required parameters: from, to, date" }, { status: 400 })
  }

  const date = new Date(dateParam)
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
  }

  const rate = await getFxRate(from, to, date)
  if (rate == null) {
    return NextResponse.json({ error: `Currency rate not found for ${to}` }, { status: 404 })
  }
  return NextResponse.json({ rate })
}

import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import {
  createContact,
  listContacts,
  type ContactFilters,
  type ContactInput,
} from "@/lib/services/contacts"
import { NextRequest, NextResponse } from "next/server"

// GET /api/contacts?type=&q=&country=&isActive=&page=&limit=
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const { searchParams } = req.nextUrl
    const type = (searchParams.get("type") ?? "all") as ContactFilters["type"]
    const q = searchParams.get("q") ?? undefined
    const country = searchParams.get("country") ?? undefined
    const isActiveParam = searchParams.get("isActive")
    const isActive =
      isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10))

    const { contacts, total } = await listContacts(
      org.id,
      { type, q, country, isActive },
      { limit, offset: (page - 1) * limit }
    )

    return NextResponse.json({ contacts, total, page, limit })
  } catch (err) {
    console.error("[GET /api/contacts]", err)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

// POST /api/contacts
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const body: ContactInput = await req.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!body.type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 })
    }

    const contact = await createContact(org.id, body)
    return NextResponse.json(contact, { status: 201 })
  } catch (err) {
    console.error("[POST /api/contacts]", err)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}

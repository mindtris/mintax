import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import {
  deleteContact,
  getContact,
  getContactStats,
  updateContact,
  type ContactInput,
} from "@/lib/services/contacts"
import { NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ contactId: string }> }

// GET /api/contacts/:contactId
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { contactId } = await params
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const [contact, stats] = await Promise.all([
      getContact(org.id, contactId),
      getContactStats(org.id, contactId),
    ])

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json({ ...contact, stats })
  } catch (err) {
    console.error("[GET /api/contacts/:id]", err)
    return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 })
  }
}

// PATCH /api/contacts/:contactId
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { contactId } = await params
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const body: ContactInput = await req.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const contact = await updateContact(org.id, contactId, body)
    return NextResponse.json(contact)
  } catch (err) {
    console.error("[PATCH /api/contacts/:id]", err)
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
  }
}

// DELETE /api/contacts/:contactId — soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { contactId } = await params
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    await deleteContact(org.id, contactId)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete contact"
    console.error("[DELETE /api/contacts/:id]", err)
    if (message === "Contact not found") {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

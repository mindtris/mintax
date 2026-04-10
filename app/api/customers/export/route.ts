import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { prisma } from "@/lib/core/db"
import { format } from "@fast-csv/format"
import { NextResponse } from "next/server"
import { Readable } from "stream"

export async function GET() {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const contacts = await prisma.contact.findMany({
      where: { organizationId: org.id, deletedAt: null },
      include: { persons: true },
      orderBy: { name: "asc" },
    })

    const csvStream = format({
      headers: [
        "Name", "Type", "Email", "Phone", "Tax ID",
        "Address", "City", "State", "Country", "Zip code",
        "Website", "Reference", "Currency", "Notes",
        "Contact person", "Contact person email", "Contact person phone",
      ],
      writeBOM: true,
    })

    for (const contact of contacts) {
      const primaryPerson = contact.persons?.find((p: any) => p.isPrimary) || contact.persons?.[0]

      csvStream.write({
        "Name": contact.name,
        "Type": contact.type,
        "Email": contact.email || "",
        "Phone": contact.phone || "",
        "Tax ID": contact.taxId || "",
        "Address": contact.address || "",
        "City": contact.city || "",
        "State": contact.state || "",
        "Country": contact.country || "",
        "Zip code": contact.zipCode || "",
        "Website": contact.website || "",
        "Reference": contact.reference || "",
        "Currency": contact.currency || "",
        "Notes": contact.notes || "",
        "Contact person": primaryPerson?.name || "",
        "Contact person email": primaryPerson?.email || "",
        "Contact person phone": primaryPerson?.phone || "",
      })
    }
    csvStream.end()

    const stream = Readable.from(csvStream)
    const timestamp = new Date().toISOString().split("T")[0]

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="contacts-${timestamp}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting contacts:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

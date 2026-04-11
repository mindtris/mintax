"use server"

import { prisma } from "@/lib/core/db"
import { ActionState } from "@/lib/actions"
import { z } from "zod"

const demoSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(2, "Company name is too short"),
  phone: z.string().optional(),
  message: z.string().optional(),
})

export async function submitDemoRequestAction(
  _prevState: ActionState<any> | null,
  formData: FormData
): Promise<ActionState<any>> {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = demoSchema.safeParse(rawData)

    if (!validated.success) {
      return { 
        success: false, 
        error: validated.error.errors[0].message 
      }
    }

    const { name, email, company, phone, message } = validated.data

    // Find the primary organization to assign this lead to
    // We'll look for an org named "Mintax" or just the first one created
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { name: { contains: "Mintax", mode: "insensitive" } },
          { slug: "mintax" }
        ]
      },
      orderBy: { createdAt: "asc" }
    }) || await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } })

    if (!org) {
      console.error("No organization found to assign lead")
      return { success: false, error: "System configuration error. Please try again later." }
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        title: `Demo Request: ${company}`,
        contactName: name,
        email,
        phone,
        company,
        description: message,
        source: "website",
        stage: "new",
        probability: 10, // Initial interest
      }
    })

    return { success: true, data: lead }
  } catch (error) {
    console.error("Failed to submit demo request:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

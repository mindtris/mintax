import { NextRequest, NextResponse } from "next/server"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { GenericEmail } from "@/components/emails/generic-email"
import { render } from "@react-email/components"
import { createElement } from "react"
import { interpolate } from "@/lib/services/email-templates"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const org = await getActiveOrg(user)

    const { subject, greeting, body, footer, variables } = await req.json()

    // Interpolate with variables
    const interpolatedSubject = interpolate(subject, variables || {})
    const interpolatedGreeting = interpolate(greeting, variables || {})
    const interpolatedBody = interpolate(body, variables || {})
    const interpolatedFooter = interpolate(footer, variables || {})

    // Render to HTML via @react-email (server-safe, works in route handlers)
    const emailHtml = await render(
      createElement(GenericEmail, {
        subject: interpolatedSubject,
        greeting: interpolatedGreeting,
        body: interpolatedBody,
        footer: interpolatedFooter,
      })
    )

    return NextResponse.json({ html: emailHtml })
  } catch (error: any) {
    console.error("[EMAIL_PREVIEW_ERROR]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

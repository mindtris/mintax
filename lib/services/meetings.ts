import { prisma } from "@/lib/core/db"

export type CalcomAttendee = {
  email?: string
  name?: string
  timeZone?: string
}

export type CalcomBookingPayload = {
  uid?: string
  title?: string
  startTime?: string
  endTime?: string
  organizer?: { email?: string; timeZone?: string }
  attendees?: CalcomAttendee[]
  location?: string
  additionalNotes?: string
  rescheduleUid?: string
  cancellationReason?: string
}

export type CalcomEvent = {
  triggerEvent?: string
  payload?: CalcomBookingPayload
}

function primaryAttendeeEmail(payload: CalcomBookingPayload): string | null {
  const fromAttendees = payload.attendees?.find((a) => a.email)?.email
  return fromAttendees ?? null
}

function primaryTimezone(payload: CalcomBookingPayload): string {
  return (
    payload.attendees?.find((a) => a.timeZone)?.timeZone ??
    payload.organizer?.timeZone ??
    "UTC"
  )
}

async function findLeadForBooking(
  organizationId: string,
  attendeeEmail: string
): Promise<{ id: string; stage: string } | null> {
  return prisma.lead.findFirst({
    where: { organizationId, email: attendeeEmail },
    orderBy: { createdAt: "desc" },
    select: { id: true, stage: true },
  })
}

export async function handleCalcomBookingCreated(
  organizationId: string,
  event: CalcomEvent
): Promise<{ status: "ok" | "skipped"; reason?: string; meetingId?: string }> {
  const payload = event.payload
  if (!payload?.uid || !payload.startTime || !payload.endTime) {
    return { status: "skipped", reason: "missing_fields" }
  }

  const attendeeEmail = primaryAttendeeEmail(payload)
  if (!attendeeEmail) return { status: "skipped", reason: "no_attendee_email" }

  const lead = await findLeadForBooking(organizationId, attendeeEmail)

  const meeting = await prisma.meeting.upsert({
    where: {
      externalProvider_externalId: { externalProvider: "calcom", externalId: payload.uid },
    },
    create: {
      organizationId,
      leadId: lead?.id ?? null,
      externalProvider: "calcom",
      externalId: payload.uid,
      title: payload.title ?? "Meeting",
      startAt: new Date(payload.startTime),
      endAt: new Date(payload.endTime),
      timezone: primaryTimezone(payload),
      status: "confirmed",
      attendeeEmail,
      location: payload.location ?? null,
      notes: payload.additionalNotes ?? null,
    },
    update: {
      title: payload.title ?? "Meeting",
      startAt: new Date(payload.startTime),
      endAt: new Date(payload.endTime),
      timezone: primaryTimezone(payload),
      status: "confirmed",
      location: payload.location ?? null,
      notes: payload.additionalNotes ?? null,
    },
    select: { id: true },
  })

  if (lead && lead.stage === "new") {
    await prisma.lead.update({ where: { id: lead.id }, data: { stage: "contacted" } })
  }

  return { status: "ok", meetingId: meeting.id }
}

export async function handleCalcomBookingRescheduled(
  organizationId: string,
  event: CalcomEvent
): Promise<{ status: "ok" | "skipped"; reason?: string; meetingId?: string }> {
  const payload = event.payload
  if (!payload?.uid || !payload.startTime || !payload.endTime) {
    return { status: "skipped", reason: "missing_fields" }
  }

  const existing = await prisma.meeting.findUnique({
    where: {
      externalProvider_externalId: { externalProvider: "calcom", externalId: payload.uid },
    },
    select: { id: true, organizationId: true },
  })

  if (existing && existing.organizationId !== organizationId) {
    return { status: "skipped", reason: "org_mismatch" }
  }

  if (!existing) {
    return handleCalcomBookingCreated(organizationId, event)
  }

  const updated = await prisma.meeting.update({
    where: { id: existing.id },
    data: {
      title: payload.title ?? undefined,
      startAt: new Date(payload.startTime),
      endAt: new Date(payload.endTime),
      timezone: primaryTimezone(payload),
      status: "rescheduled",
      location: payload.location ?? undefined,
      notes: payload.additionalNotes ?? undefined,
    },
    select: { id: true },
  })

  return { status: "ok", meetingId: updated.id }
}

export async function handleCalcomBookingCancelled(
  organizationId: string,
  event: CalcomEvent
): Promise<{ status: "ok" | "skipped"; reason?: string; meetingId?: string }> {
  const payload = event.payload
  if (!payload?.uid) return { status: "skipped", reason: "missing_uid" }

  const existing = await prisma.meeting.findUnique({
    where: {
      externalProvider_externalId: { externalProvider: "calcom", externalId: payload.uid },
    },
    select: { id: true, organizationId: true },
  })

  if (!existing) return { status: "skipped", reason: "not_found" }
  if (existing.organizationId !== organizationId) return { status: "skipped", reason: "org_mismatch" }

  const updated = await prisma.meeting.update({
    where: { id: existing.id },
    data: {
      status: "cancelled",
      notes: payload.cancellationReason ?? undefined,
    },
    select: { id: true },
  })

  return { status: "ok", meetingId: updated.id }
}

export async function listMeetingsForLead(organizationId: string, leadId: string) {
  return prisma.meeting.findMany({
    where: { organizationId, leadId },
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      timezone: true,
      status: true,
      attendeeEmail: true,
      location: true,
      externalUrl: true,
      externalProvider: true,
    },
  })
}

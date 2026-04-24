import { CalendarView } from "@/components/engage/calendar-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Calendar",
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams
  return <CalendarView month={params.month} />
}

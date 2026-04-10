import { DirectoryView } from "@/components/people/directory-view"
import { QuicklinksView } from "@/components/people/quicklinks-view"
import { RemindersView } from "@/components/people/reminders-view"
import { TimeOffView } from "@/components/people/time-off-view"
import { DocumentsView } from "@/components/people/documents-view"
import { OnboardingView } from "@/components/people/onboarding-view"
import { ReminderFilters } from "@/lib/services/reminders"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "People",
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<ReminderFilters & { tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "directory"

  const renderView = () => {
    switch (activeTab) {
      case "directory":
        return <DirectoryView />
      case "quicklinks":
        return <QuicklinksView />
      case "reminders":
        return <RemindersView searchParams={params} />
      case "time-off":
        return <TimeOffView />
      case "documents":
        return <DocumentsView />
      case "onboarding":
        return <OnboardingView />
      default:
        return <DirectoryView />
    }
  }

  return renderView()
}

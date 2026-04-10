import { QuicklinkCard, QuicklinkData } from "@/components/quicklinks/quicklink-card"

export const MOCK_LINKS: QuicklinkData[] = [
  { id: "1", title: "Employee Portal", url: "https://workday.com", category: "HR & People" },
  { id: "2", title: "Benefits Hub", url: "https://gusto.com", category: "HR & People" },
  { id: "3", title: "Design System", url: "https://figma.com", category: "Engineering" },
  { id: "4", title: "Analytics Board", url: "https://mixpanel.com", category: "Product" },
  { id: "5", title: "Support Inbox", url: "https://intercom.com", category: "Support" },
  { id: "6", title: "Cloud Console", url: "https://aws.amazon.com", category: "Engineering" },
]

export function QuicklinksGrid({ links = MOCK_LINKS }: { links?: QuicklinkData[] }) {
  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.category]) acc[link.category] = []
    acc[link.category].push(link)
    return acc
  }, {} as Record<string, QuicklinkData[]>)

  if (Object.keys(groupedLinks).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-lg bg-card text-card-foreground">
        <p className="text-muted-foreground text-sm">No quicklinks added yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full p-1 max-w-7xl">
      {Object.entries(groupedLinks).map(([category, catLinks]) => (
        <section key={category} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold border-b pb-2">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {catLinks.map(link => (
              <QuicklinkCard key={link.id} link={link} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

import { MicrosoftGraphProvider } from "@/lib/integrations/microsoft-graph-provider"

export default async function AppsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MicrosoftGraphProvider>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </MicrosoftGraphProvider>
  )
}

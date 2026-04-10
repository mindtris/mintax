import { MicrosoftGraphProvider } from "@/lib/integrations/microsoft-graph-provider"

export default function HireLayout({ children }: { children: React.ReactNode }) {
  return <MicrosoftGraphProvider>{children}</MicrosoftGraphProvider>
}

import { EmptyState } from "@/components/ui/empty-state"

export function BrandingView() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Branding</h1>
      </header>
      <EmptyState
        title="Branding"
        description="Manage employer branding assets. Coming soon."
      />
    </div>
  )
}

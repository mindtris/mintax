import { Button } from "@/components/ui/button"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { resetFieldsAndCategories, resetLLMSettings } from "./actions"

export default async function DangerSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground mt-1">
          These actions will overwrite existing fields, categories, and prompts. Use only if something is broken.
        </p>
      </div>
      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-base font-semibold">LLM settings</h3>
          <p className="text-sm text-muted-foreground">
            Reset the system prompt and other LLM settings to their default values.
          </p>
          <form
            action={async () => {
              "use server"
              await resetLLMSettings(org)
            }}
          >
            <Button variant="destructive" type="submit">
              Reset main LLM prompt
            </Button>
          </form>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Fields, currencies and categories</h3>
          <p className="text-sm text-muted-foreground">
            Reset all fields, currencies, and categories to their default values.
          </p>
          <form
            action={async () => {
              "use server"
              await resetFieldsAndCategories(org)
            }}
          >
            <Button variant="destructive" type="submit">
              Reset fields, currencies and categories
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

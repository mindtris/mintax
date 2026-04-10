import { LLMProvidersGrid } from "@/components/settings/llm-providers-grid"
import { CrudTable } from "@/components/settings/crud"
import { addLlmPromptAction, editLlmPromptAction, deleteLlmPromptAction } from "@/app/(app)/settings/actions"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getSettings } from "@/lib/services/settings"
import { getLlmPrompts, ensureDefaultPrompts, LLM_MODULES } from "@/lib/services/llm-prompts"
import { PROVIDERS } from "@/lib/integrations/llm-providers"

export default async function LlmSettingsPage() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const settings = await getSettings(org.id)

  // Ensure default prompts exist
  await ensureDefaultPrompts(org.id)

  const prompts = await getLlmPrompts(org.id)
  const promptsWithActions = prompts.map((p) => ({
    ...p,
    isEditable: true,
    isDeletable: true,
  }))

  const moduleOptions = LLM_MODULES.map((m) => ({ label: m.label, value: m.value }))
  const providerOptions = [
    { label: "Default", value: "default" },
    ...PROVIDERS.map((p) => ({ label: p.label, value: p.key })),
  ]

  return (
    <div className="flex flex-col gap-10">
      <LLMProvidersGrid settings={settings} />

      <CrudTable
        title="Prompts"
        description="Configure AI prompts for each module. Each module uses its own prompt for LLM analysis."
        items={promptsWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          { key: "module", label: "Module", type: "select", complexOptions: moduleOptions, editable: true, filterable: true },
          { key: "provider", label: "Provider", type: "select", complexOptions: providerOptions, editable: true, filterable: true },
          { key: "model", label: "Model override", editable: true },
          { key: "enabled", label: "Active", type: "checkbox", defaultValue: true, editable: true },
        ]}
        searchPlaceholder="Search prompts..."
        onDelete={async (id) => {
          "use server"
          return await deleteLlmPromptAction(org.id, id)
        }}
        onAdd={async (data) => {
          "use server"
          return await addLlmPromptAction(org.id, data)
        }}
        onEdit={async (id, data) => {
          "use server"
          return await editLlmPromptAction(org.id, id, data)
        }}
      />

    </div>
  )
}

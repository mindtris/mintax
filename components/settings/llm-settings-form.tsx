"use client"

import { fieldsToJsonSchema } from "@/lib/ai/schema"
import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Field } from "@/lib/prisma/client"
import { Edit } from "lucide-react"
import Link from "next/link"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

export default function LLMSettingsForm({
  settings,
  fields,
}: {
  settings: Record<string, string>
  fields: Field[]
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  useEffect(() => {
    if (saveState?.success) toast.success("Prompt saved")
    if (saveState?.error) toast.error(saveState.error)
  }, [saveState])

  return (
    <div className="flex flex-col gap-8">
      <form action={saveAction} className="space-y-4 max-w-2xl">
        <FormTextarea
          title="Prompt for file analysis form"
          name="prompt_analyse_new_file"
          defaultValue={settings.prompt_analyse_new_file}
          className="h-96"
        />

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save prompt"}
        </Button>

        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </form>

      <div className="bg-white border border-black/[0.05] rounded-xl flex flex-col gap-4 p-6 shadow-sm max-w-2xl">
        <div className="flex flex-row justify-between items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">
            Current JSON Schema
          </span>
          <Link
            href="/settings?tab=fields"
            className="text-xs underline inline-flex flex-row items-center gap-1 text-muted-foreground"
          >
            <Edit className="w-4 h-4" /> Edit fields
          </Link>
        </div>
        <div className="bg-black/[0.02] p-4 rounded-lg border border-black/[0.03]">
          <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
            {JSON.stringify(fieldsToJsonSchema(fields), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

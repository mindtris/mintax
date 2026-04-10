import { UnsortedFileTable } from "@/components/unsorted/file-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AnalyzeAllButton } from "@/components/unsorted/analyze-all-button"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import config from "@/lib/core/config"
import { getCategories } from "@/lib/services/categories"
import { getCurrencies } from "@/lib/services/currencies"
import { getFields } from "@/lib/services/fields"
import { getUnsortedFiles } from "@/lib/services/files"
import { getProjects } from "@/lib/services/projects"
import { getSettings } from "@/lib/services/settings"
import { Settings, Upload } from "lucide-react"
import Link from "next/link"
import { UploadButton } from "@/components/files/upload-button"

export async function UnsortedView({ searchParams }: { searchParams: Promise<any> }) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const params = await searchParams
  const files = await getUnsortedFiles(org.id, params)
  const categories = await getCategories(org.id)
  const projects = await getProjects(org.id)
  const currencies = await getCurrencies(org.id)
  const fields = await getFields(org.id)
  const settings = await getSettings(org.id)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Unsorted</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {files.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
            {files.length > 1 && <AnalyzeAllButton />}
            <UploadButton>
                <Upload className="h-4 w-4 mr-2" />
                Upload documents
            </UploadButton>
        </div>
      </header>

      {config.selfHosted.isEnabled &&
        !settings.openai_api_key &&
        !settings.google_api_key &&
        !settings.mistral_api_key &&
        !settings.openai_compatible_base_url && (
          <Alert>
            <Settings className="h-4 w-4 mt-2" />
            <div className="flex flex-row justify-between pt-2">
              <div className="flex flex-col">
                <AlertTitle>LLM provider API Key is required for analyzing files</AlertTitle>
                <AlertDescription>
                  Please set your LLM provider API key in the settings to use the analyze form.
                </AlertDescription>
              </div>
              <Link href="/settings/llm">
                <Button>Go to Settings</Button>
              </Link>
            </div>
          </Alert>
        )}

      <UnsortedFileTable 
        files={files}
        categories={categories}
        projects={projects}
        currencies={currencies}
        fields={fields}
        settings={settings}
      />
    </div>
  )
}

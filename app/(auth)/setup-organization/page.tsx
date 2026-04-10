import { getSession } from "@/lib/core/auth"
import { redirect } from "next/navigation"
import { SetupWizard } from "./setup-wizard"

export default async function SetupOrganizationPage() {
  const session = await getSession()
  if (!session) {
    redirect("/signin")
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center gap-3 text-center mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Setup your organization
        </h1>
        <p className="text-sm text-muted-foreground">
          Let's configure your workspace basics. You can always change these later.
        </p>
      </div>

      <SetupWizard />
    </div>
  )
}

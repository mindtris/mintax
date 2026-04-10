import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/core/config"
import { PROVIDERS } from "@/lib/integrations/llm-providers"
import { getSelfHostedUser } from "@/lib/services/users"
import { ShieldAlert } from "lucide-react"
import Image from "next/image"
import { redirect } from "next/navigation"
import SelfHostedSetupFormClient from "./setup-form-client"
import { SelfHostedPinForm } from "./pin-form"

export default async function SelfHostedWelcomePage() {
  if (!config.selfHosted.isEnabled) {
    return (
      <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" />
          <span>Self-Hosted Mode is not enabled</span>
        </CardTitle>
        <CardDescription className="text-center text-lg flex flex-col gap-2">
          <p>
            To use Mintax in self-hosted mode, please set <code className="font-bold">SELF_HOSTED_MODE=true</code> in
            your environment.
          </p>
          <p>In self-hosted mode you can use your own ChatGPT API key and store your data on your own server.</p>
        </CardDescription>
      </Card>
    )
  }

  // If PIN is required, show PIN form
  const pin = process.env.SELF_HOSTED_PIN
  if (pin) {
    return (
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/logo/logo.svg" alt="Mintax" width={48} height={48} className="w-12 h-12" />
          <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
            <ColoredText>Mintax</ColoredText> Self-Hosted
          </h1>
          <p className="text-sm text-white/60">
            Enter your PIN to access this instance.
          </p>
        </div>
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl">
          <SelfHostedPinForm />
        </div>
      </div>
    )
  }

  // No PIN — original setup flow
  const user = await getSelfHostedUser()
  if (user) {
    redirect(config.selfHosted.redirectUrl)
  }

  const defaultProvider = PROVIDERS[0].key
  const defaultApiKeys: Record<string, string> = {
    openai: config.ai.openaiApiKey ?? "",
    google: config.ai.googleApiKey ?? "",
    mistral: config.ai.mistralApiKey ?? "",
  }

  return (
    <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-4">
      <Image src="/logo/logo.svg" alt="Logo" width={64} height={64} className="w-16 h-16" />
      <CardTitle className="text-3xl font-bold ">
        <ColoredText>Mintax: Self-Hosted Edition</ColoredText>
      </CardTitle>
      <CardDescription className="flex flex-col gap-4 text-center text-lg">
        <p>Welcome to your own instance of Mintax. Let&apos;s set up a couple of settings to get started.</p>
        <SelfHostedSetupFormClient defaultProvider={defaultProvider} defaultApiKeys={defaultApiKeys} />
      </CardDescription>
    </Card>
  )
}

export const dynamic = "force-dynamic"

import { SignupForm } from "@/components/auth/signup-form"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/core/config"
import Image from "next/image"
import { redirect } from "next/navigation"

export default async function SignupPage() {
  if (config.selfHosted.isEnabled) {
    redirect(config.selfHosted.redirectUrl)
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/logo/logo.svg" alt="Mintax" width={40} height={40} className="w-10 h-10" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your <ColoredText>Mintax</ColoredText> account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join Mintax and start managing your finances with professional precision.
        </p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/signin" className="font-semibold text-primary hover:underline">
          Sign In
        </a>
      </p>
    </div>
  )
}

import { LoginForm } from "@/components/auth/login-form"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/core/config"
import Image from "next/image"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  if (config.selfHosted.isEnabled) {
    redirect(config.selfHosted.redirectUrl)
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/logo/logo.svg" alt="Mintax" width={40} height={40} className="w-10 h-10" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back to <ColoredText>Mintax</ColoredText>
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to receive a secure login code.
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="font-semibold text-primary hover:underline">
          Sign Up
        </a>
      </p>
    </div>
  )
}

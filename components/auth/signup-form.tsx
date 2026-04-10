"use client"

import { FormError } from "@/components/forms/error"
import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/core/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignupForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      })

      if (result.error) {
        setError(result.error.message || "Failed to start registration")
        return
      }

      setIsOtpSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start registration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      })

      if (result.error) {
        setError("The code is invalid or expired")
        return
      }

      router.push("/setup-organization")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify identity")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="grid gap-6 w-full">
      <div className="grid gap-4">
        {!isOtpSent && (
          <FormInput
            title="Full name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            className="bg-background border-border focus:ring-primary shadow-sm"
          />
        )}
        <FormInput
          title="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isOtpSent || isLoading}
          className="bg-background border-border focus:ring-primary shadow-sm"
        />

        {isOtpSent && (
          <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
            <FormInput
              title="Verification code"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              pattern="[0-9]{6}"
              className="tracking-[0.5em] text-center text-lg font-semibold bg-background border-border focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground text-center">
              A 6-digit code has been sent to your email.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Processing...
            </div>
          ) : isOtpSent ? "Complete Registration" : "Get Started"}
        </Button>

        {isOtpSent && (
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={isLoading}
            className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest text-center"
          >
            Resend Code
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
          <FormError className="text-center text-xs font-medium text-destructive">{error}</FormError>
        </div>
      )}
    </form>
  )
}

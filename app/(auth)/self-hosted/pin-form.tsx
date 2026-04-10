"use client"

import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SelfHostedPinForm() {
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/self-hosted-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })

      if (res.ok) {
        window.location.href = "/dashboard"
      } else {
        const data = await res.json()
        setError(data.error || "Invalid PIN")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-white">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Access PIN</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          required
          autoFocus
          className="w-full h-11 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-center text-lg tracking-[0.3em] font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <FormError className="text-center text-xs font-medium text-red-300">{error}</FormError>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 text-sm font-semibold bg-white text-black hover:bg-white/90 shadow-sm transition-all active:scale-[0.98]"
      >
        {isLoading ? "Verifying..." : "Unlock"}
      </Button>
    </form>
  )
}

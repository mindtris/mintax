"use client"

import { Button } from "@/components/ui/button"
import { Landmark } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { usePlaidLink } from "react-plaid-link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PlaidLinkButtonProps {
  onLinked?: () => void
  label?: string
  disabled?: boolean
}

export function PlaidLinkButton({ onLinked, label = "Connect with Plaid", disabled }: PlaidLinkButtonProps) {
  const router = useRouter()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  const fetchLinkToken = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to get link token")
      setLinkToken(data.linkToken)
    } catch (e: any) {
      toast.error(e.message || "Could not start Plaid")
    } finally {
      setFetching(false)
    }
  }, [])

  const onSuccess = useCallback(
    async (publicToken: string) => {
      try {
        const res = await fetch("/api/plaid/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to link account")
        toast.success("Bank account connected")
        onLinked?.()
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || "Failed to link account")
      }
    },
    [onLinked, router]
  )

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  })

  useEffect(() => {
    if (linkToken && ready) {
      open()
      setLinkToken(null)
    }
  }, [linkToken, ready, open])

  return (
    <Button onClick={fetchLinkToken} disabled={disabled || fetching} className="w-full">
      <Landmark className="h-4 w-4" />
      <span>{fetching ? "Starting..." : label}</span>
    </Button>
  )
}

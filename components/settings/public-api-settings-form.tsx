"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { FormTextarea } from "@/components/forms/simple"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Eye, EyeOff, Copy, Check } from "lucide-react"
import {
  savePublicApiConfigAction,
  togglePublicApiEnabledAction,
} from "@/app/(app)/settings/public-api/actions"
import type { PublicApiConfigView } from "@/lib/services/public-api-config"

type Props = {
  initialConfig: PublicApiConfigView | null
  orgSlug: string
  apiBaseUrl: string
}

export default function PublicApiSettingsForm({ initialConfig, orgSlug, apiBaseUrl }: Props) {
  const [state, action, pending] = useActionState(savePublicApiConfigAction, null)
  const [sheetOpen, setSheetOpen] = useState<boolean>(false)
  const [togglePending, setTogglePending] = useState<boolean>(false)
  const [dirty, setDirty] = useState<boolean>(false)

  const [enabled, setEnabled] = useState<boolean>(initialConfig?.enabled ?? false)
  const [leadsEnabled, setLeadsEnabled] = useState<boolean>(initialConfig?.leadsEnabled ?? true)
  const [origins, setOrigins] = useState<string>((initialConfig?.allowedOrigins ?? []).join("\n"))
  const [ratePerMinute, setRatePerMinute] = useState<number>(initialConfig?.ratePerMinute ?? 5)
  const [secretInput, setSecretInput] = useState<string>("")
  const [clearSecret, setClearSecret] = useState<boolean>(false)
  const [revealSecret, setRevealSecret] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [webhookCopied, setWebhookCopied] = useState<boolean>(false)

  const [calcomEnabled, setCalcomEnabled] = useState<boolean>(initialConfig?.calcomEnabled ?? false)
  const [contentEnabled, setContentEnabled] = useState<boolean>(initialConfig?.contentEnabled ?? false)
  const [contentCacheSeconds, setContentCacheSeconds] = useState<number>(initialConfig?.contentCacheSeconds ?? 60)
  const [contentCopied, setContentCopied] = useState<boolean>(false)

  const markDirty = () => setDirty(true)

  useEffect(() => {
    if (state?.success) {
      toast.success("Public API settings saved")
      setSecretInput("")
      setClearSecret(false)
      setDirty(false)
      setSheetOpen(false)
    }
    if (state?.error) toast.error(state.error)
  }, [state])

  const leadsEndpoint = `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/public/leads`
  const calcomWebhookUrl = `${apiBaseUrl.replace(/\/+$/, "")}/api/webhooks/calcom?org=${encodeURIComponent(orgSlug)}`
  const contentEndpoint = `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/public/content?org=${encodeURIComponent(orgSlug)}&type=blog`
  const contentCurl = `curl "${contentEndpoint}" \\
  -H "Origin: ${origins.split(/\s+/).find((o) => o.trim()) || "https://example.com"}"`

  const curlExample = useMemo(
    () => `curl -X POST ${leadsEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "Origin: ${origins.split(/\s+/).find((o) => o.trim()) || "https://example.com"}" \\
  -d '{
    "orgSlug": "${orgSlug}",
    "source": "contact-sales",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "company": "Acme",
    "turnstileToken": "<cloudflare-turnstile-token>"
  }'`,
    [leadsEndpoint, orgSlug, origins]
  )

  const handleCopyCurl = async () => {
    await navigator.clipboard.writeText(curlExample)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleToggleEnabled = async (next: boolean) => {
    const prev = enabled
    setEnabled(next)
    setTogglePending(true)
    const result = await togglePublicApiEnabledAction(next)
    setTogglePending(false)
    if (!result.success) {
      setEnabled(prev)
      toast.error(result.error ?? "Failed to update public API status")
      return
    }
    toast.success(next ? "Public API enabled" : "Public API disabled")
    if (next) setSheetOpen(true)
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <section className="flex items-center justify-between gap-4 rounded-lg border bg-card p-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Public API</span>
          <span
            className={
              enabled
                ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            <span className={enabled ? "h-1.5 w-1.5 rounded-full bg-emerald-500" : "h-1.5 w-1.5 rounded-full bg-muted-foreground/50"} />
            {enabled ? "Active" : "Disabled"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {enabled ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setSheetOpen(true)}>
              Configure
            </Button>
          ) : null}
          <Switch
            checked={enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={togglePending}
            aria-label="Enable public API"
          />
        </div>
      </section>

      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Public API settings</SheetTitle>
        </SheetHeader>

        <form action={action} className="flex flex-col gap-6 mt-6">
      <Input type="hidden" name="enabled" value={enabled ? "true" : "false"} readOnly />
      <Input type="hidden" name="leadsEnabled" value={leadsEnabled ? "true" : "false"} readOnly />
      <Input type="hidden" name="clearTurnstileSecret" value={clearSecret ? "true" : "false"} readOnly />
      <Input type="hidden" name="calcomEnabled" value={calcomEnabled ? "true" : "false"} readOnly />
      <Input type="hidden" name="contentEnabled" value={contentEnabled ? "true" : "false"} readOnly />

      <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <div>
          <h3 className="text-base font-semibold">Allowed origins</h3>
          <p className="text-sm text-muted-foreground mt-1">
            One origin per line. Requests from origins not on this list are rejected with 403.
          </p>
        </div>
        <FormTextarea
          name="allowedOrigins"
          title="Origins"
          value={origins}
          onChange={(e) => {
            setOrigins(e.target.value)
            markDirty()
          }}
          placeholder={"https://example.com\nhttps://www.example.com\nhttp://localhost:3000"}
          rows={5}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <div>
          <h3 className="text-base font-semibold">Cloudflare Turnstile</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Server-side secret key. Get one at{" "}
            <a
              href="https://dash.cloudflare.com/?to=/:account/turnstile"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              dash.cloudflare.com/turnstile
            </a>
            . The site key lives on your marketing site.
          </p>
        </div>

        {initialConfig?.hasTurnstileSecret && !clearSecret ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-sm font-mono">
              {revealSecret ? (initialConfig.turnstileSecretPreview ?? "") : "••••••••••••••••••••"}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setRevealSecret((v) => !v)}>
              {revealSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setClearSecret(true); markDirty() }}>
              Replace
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="turnstileSecret">{clearSecret ? "Replacement secret key" : "Secret key"}</Label>
            <Input
              id="turnstileSecret"
              name="turnstileSecret"
              type="password"
              autoComplete="off"
              value={secretInput}
              onChange={(e) => {
                setSecretInput(e.target.value)
                markDirty()
              }}
              placeholder="0x4AAAAAAA..."
            />
            {clearSecret ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  setClearSecret(false)
                  setSecretInput("")
                }}
              >
                Cancel replace
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <div>
          <h3 className="text-base font-semibold">Rate limit</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Maximum requests per minute per IP. Default 5.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            name="ratePerMinute"
            min={1}
            max={1000}
            value={ratePerMinute}
            onChange={(e) => {
              setRatePerMinute(parseInt(e.target.value || "5", 10))
              markDirty()
            }}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">requests per minute per IP</span>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <div>
          <h3 className="text-base font-semibold">Endpoints</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select which public endpoints are active for this organization.
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={leadsEnabled}
            onCheckedChange={(v) => { setLeadsEnabled(v === true); markDirty() }}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-medium">Leads</span>
            <span className="block text-muted-foreground font-mono text-xs">
              POST /api/v1/public/leads
            </span>
          </span>
        </label>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <div>
          <h3 className="text-base font-semibold">Calendar (cal.diy)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Receive booking events from cal.diy to automatically create Meeting records and advance lead stages.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={calcomEnabled}
            onCheckedChange={(v) => { setCalcomEnabled(v === true); markDirty() }}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-medium">Enable cal.diy webhook</span>
            <span className="block text-muted-foreground">
              When off, cal.diy webhook calls for this organization return 404.
            </span>
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <Label>Webhook URL</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-xs font-mono overflow-x-auto whitespace-nowrap">
              {calcomWebhookUrl}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(calcomWebhookUrl)
                setWebhookCopied(true)
                setTimeout(() => setWebhookCopied(false), 1500)
              }}
            >
              {webhookCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste into cal.diy → Settings → Developer → Webhooks. Subscribe to BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED.
          </p>
        </div>

      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Content</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Public-read endpoints for blog / docs / help / changelog content authored in Engage.
              When off, GET /api/v1/public/content returns 404.
            </p>
          </div>
          <Switch
            checked={contentEnabled}
            onCheckedChange={(v) => { setContentEnabled(v); markDirty() }}
            aria-label="Enable content API"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="contentCacheSeconds" className="text-sm">Cache (s-maxage)</Label>
          <Input
            id="contentCacheSeconds"
            type="number"
            name="contentCacheSeconds"
            min={0}
            max={86400}
            value={contentCacheSeconds}
            onChange={(e) => {
              setContentCacheSeconds(parseInt(e.target.value || "60", 10))
              markDirty()
            }}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">seconds (stale-while-revalidate: 600)</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 text-xs font-mono rounded-md border bg-muted/30 px-3 py-2 overflow-x-auto whitespace-nowrap">
            {contentEndpoint}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(contentCurl)
              setContentCopied(true)
              setTimeout(() => setContentCopied(false), 1500)
            }}
          >
            {contentCopied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
            {contentCopied ? "Copied" : "Copy curl"}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Example request</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Test the leads endpoint with your current settings.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleCopyCurl}>
            {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
            {copied ? "Copied" : "Copy curl"}
          </Button>
        </div>
        <pre className="text-xs bg-muted/40 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all">
          {curlExample}
        </pre>
      </section>
      </div>

          <SheetFooter className="mt-2">
            <Button type="submit" disabled={pending || !dirty}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

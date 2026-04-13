import { PoorManCache } from "@/lib/core/cache"
import { format, isSameDay, subDays } from "date-fns"

type HistoricRate = {
  currency: string
  rate: number
  inverse: number
}

const fxCache = new PoorManCache<number>(24 * 60 * 60 * 1000)
const CLEANUP_INTERVAL = 90 * 60 * 1000
if (typeof setInterval !== "undefined") {
  setInterval(() => fxCache.cleanup(), CLEANUP_INTERVAL)
}

function cacheKey(from: string, to: string, date: string): string {
  return `${from},${to},${date}`
}

/**
 * Server-side FX rate fetcher (xe.com scrape). Returns the `from→to` rate
 * on the given date, or null on any failure. Safe to call from sync jobs.
 */
export async function getFxRate(
  from: string,
  to: string,
  date: Date
): Promise<number | null> {
  if (!from || !to || from === to) return 1

  let d = date
  if (isSameDay(d, new Date())) d = subDays(d, 1)
  const formatted = format(d, "yyyy-MM-dd")

  const key = cacheKey(from, to, formatted)
  const cached = fxCache.get(key)
  if (cached !== undefined) return cached

  try {
    const url = `https://www.xe.com/currencytables/?from=${from}&date=${formatted}`
    const res = await fetch(url)
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    )
    if (!match?.[1]) return null
    const data = JSON.parse(match[1])
    const rates = data?.props?.pageProps?.historicRates as HistoricRate[] | undefined
    if (!rates?.length) return null
    const found = rates.find((r) => r.currency === to)
    if (!found) return null
    fxCache.set(key, found.rate)
    return found.rate
  } catch {
    return null
  }
}

/**
 * Convert a cents amount between currencies. Returns { convertedCents, rate }
 * or null if rate cannot be fetched. If currencies match, rate is 1.
 */
export async function convertAmount(
  cents: number,
  from: string,
  to: string,
  date: Date
): Promise<{ convertedCents: number; rate: number } | null> {
  const rate = await getFxRate(from, to, date)
  if (rate == null) return null
  return { convertedCents: Math.round(cents * rate), rate }
}

import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid"
import config from "@/lib/core/config"

let _client: PlaidApi | null = null

export function getPlaidClient(): PlaidApi {
  if (_client) return _client
  if (!config.plaid.clientId || !config.plaid.secret) {
    throw new Error("Plaid is not configured (set PLAID_CLIENT_ID and PLAID_SECRET)")
  }
  const configuration = new Configuration({
    basePath: PlaidEnvironments[config.plaid.env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": config.plaid.clientId,
        "PLAID-SECRET": config.plaid.secret,
      },
    },
  })
  _client = new PlaidApi(configuration)
  return _client
}

export const PLAID_COUNTRY_CODES: CountryCode[] = config.plaid.countryCodes.map(
  (c) => c as CountryCode
)

export const PLAID_PRODUCTS: Products[] = [Products.Transactions]

export function isPlaidConfigured(): boolean {
  return Boolean(config.plaid.clientId && config.plaid.secret && config.plaid.encryptionKey)
}

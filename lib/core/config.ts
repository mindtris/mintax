import { z } from "zod"

const envSchema = z.object({
  BASE_URL: z.string().url().default("http://localhost:7331"),
  PORT: z.string().default("7331"),
  SELF_HOSTED_MODE: z.enum(["true", "false"]).default("true"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL_NAME: z.string().default("gpt-4o-mini"),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL_NAME: z.string().default("gemini-2.5-flash"),
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL_NAME: z.string().default("mistral-medium-latest"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "Auth secret must be at least 16 characters")
    .default("please-set-your-key-here"),
  DISABLE_SIGNUP: z.enum(["true", "false"]).default("false"),
  RESEND_API_KEY: z.string().default("please-set-your-resend-api-key-here"),
  RESEND_FROM_EMAIL: z.string().default("Mintax <noreply@mintax.app>"),
  RESEND_AUDIENCE_ID: z.string().default(""),
  MAIL_DRIVER: z.enum(["resend", "smtp"]).default("resend"),
  MAIL_SMTP_HOST: z.string().optional(),
  MAIL_SMTP_PORT: z.string().default("465"),
  MAIL_SMTP_USERNAME: z.string().optional(),
  MAIL_SMTP_PASSWORD: z.string().optional(),
  MAIL_SMTP_ENCRYPTION: z.enum(["ssl", "tls", "none"]).default("ssl"),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  // Plaid (bank connections)
  PLAID_CLIENT_ID: z.string().default(""),
  PLAID_SECRET: z.string().default(""),
  PLAID_ENV: z.enum(["sandbox", "development", "production"]).default("sandbox"),
  PLAID_WEBHOOK_SECRET: z.string().default(""),
  PLAID_ENCRYPTION_KEY: z.string().default(""), // 32-byte base64
  // Social media providers
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  PINTEREST_CLIENT_ID: z.string().optional(),
  PINTEREST_CLIENT_SECRET: z.string().optional(),
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  DRIBBBLE_CLIENT_ID: z.string().optional(),
  DRIBBBLE_CLIENT_SECRET: z.string().optional(),
  TWITCH_CLIENT_ID: z.string().optional(),
  TWITCH_CLIENT_SECRET: z.string().optional(),
  // Cron
  CRON_SECRET: z.string().optional(),
  // Microsoft Graph
  NEXT_PUBLIC_MICROSOFT_CLIENT_ID: z.string().default(""),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_REPO: z.string().default("mindtris/mintax"),
  TELEMETRY_ENDPOINT: z.string().optional(),
  TELEMETRY_DISABLED: z.enum(["true", "false"]).default("false"),
})

const env = envSchema.parse(process.env)

const config = {
  app: {
    title: "Mintax",
    description: "Multi-tenant bookkeeping & accounting platform",
    version: process.env.npm_package_version || "0.0.1",
    baseURL: env.BASE_URL || `http://localhost:${env.PORT || "7331"}`,
    supportEmail: "support@mindtris.com",
  },
  upload: {
    acceptedMimeTypes: "image/*,.pdf,.doc,.docx,.xls,.xlsx",
    images: {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 90,
    },
    pdfs: {
      maxPages: 10,
      dpi: 150,
      quality: 90,
      maxWidth: 1500,
      maxHeight: 1500,
    },
  },
  selfHosted: {
    isEnabled: env.SELF_HOSTED_MODE === "true",
    redirectUrl: "/self-hosted/redirect",
    welcomeUrl: "/self-hosted",
  },
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModelName: env.OPENAI_MODEL_NAME,
    googleApiKey: env.GOOGLE_API_KEY,
    googleModelName: env.GOOGLE_MODEL_NAME,
    mistralApiKey: env.MISTRAL_API_KEY,
    mistralModelName: env.MISTRAL_MODEL_NAME,
  },
  auth: {
    secret: env.BETTER_AUTH_SECRET,
    loginUrl: "/signin",
    disableSignup: env.DISABLE_SIGNUP === "true" || env.SELF_HOSTED_MODE === "true",
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    paymentSuccessUrl: `${env.BASE_URL}/cloud/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    paymentCancelUrl: `${env.BASE_URL}/cloud`,
  },
  plaid: {
    clientId: env.PLAID_CLIENT_ID,
    secret: env.PLAID_SECRET,
    env: env.PLAID_ENV,
    webhookSecret: env.PLAID_WEBHOOK_SECRET,
    encryptionKey: env.PLAID_ENCRYPTION_KEY,
    countryCodes: ["US", "CA", "GB"],
  },
  email: {
    driver: env.MAIL_DRIVER,
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM_EMAIL,
    audienceId: env.RESEND_AUDIENCE_ID,
    smtp: {
      host: env.MAIL_SMTP_HOST,
      port: parseInt(env.MAIL_SMTP_PORT, 10),
      username: env.MAIL_SMTP_USERNAME,
      password: env.MAIL_SMTP_PASSWORD,
      encryption: env.MAIL_SMTP_ENCRYPTION,
    },
  },
  social: {
    twitter: { clientId: env.TWITTER_CLIENT_ID, clientSecret: env.TWITTER_CLIENT_SECRET },
    linkedin: { clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET },
    facebook: { appId: env.FACEBOOK_APP_ID, appSecret: env.FACEBOOK_APP_SECRET },
    tiktok: { clientKey: env.TIKTOK_CLIENT_KEY, clientSecret: env.TIKTOK_CLIENT_SECRET },
    google: { clientId: env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET },
    pinterest: { clientId: env.PINTEREST_CLIENT_ID, clientSecret: env.PINTEREST_CLIENT_SECRET },
    reddit: { clientId: env.REDDIT_CLIENT_ID, clientSecret: env.REDDIT_CLIENT_SECRET },
    dribbble: { clientId: env.DRIBBBLE_CLIENT_ID, clientSecret: env.DRIBBBLE_CLIENT_SECRET },
    twitch: { clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET },
  },
  cron: {
    secret: env.CRON_SECRET,
  },
  microsoft: {
    clientId: env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
  },
  github: {
    token: env.GITHUB_TOKEN,
    repo: env.GITHUB_REPO,
  },
  telemetry: {
    endpoint: env.TELEMETRY_ENDPOINT,
    isDisabled: env.TELEMETRY_DISABLED === "true",
  },
} as const

export default config

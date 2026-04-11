import { createAuthClient } from "better-auth/client"
import { emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  advanced: {
    cookiePrefix: "mintax",
  },
  plugins: [emailOTPClient()],
})

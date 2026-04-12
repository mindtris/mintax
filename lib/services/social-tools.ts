import { prisma } from "@/lib/core/db"
import { getProvider } from "@/lib/integrations/social"
import { updateSocialAccountTokens } from "./social-accounts"

export async function runSocialTool(orgId: string, accountId: string, tool: string, params: any = {}) {
  const account = await prisma.socialAccount.findFirst({
    where: { id: accountId, organizationId: orgId },
  })

  if (!account) throw new Error("Account not found")

  const provider = getProvider(account.provider)
  if (!provider.runTool) throw new Error(`Provider ${account.provider} does not support tools`)

  let accessToken = account.accessToken

  // Refresh token if needed
  if (account.tokenExpiresAt && account.tokenExpiresAt < new Date() && account.refreshToken) {
    try {
      const refreshed = await provider.refreshToken(account.refreshToken)
      accessToken = refreshed.accessToken
      await updateSocialAccountTokens(account.id, orgId, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        tokenExpiresAt: refreshed.expiresIn 
          ? new Date(Date.now() + refreshed.expiresIn * 1000) 
          : undefined,
      })
    } catch (err) {
      console.error("Failed to refresh token during tool run:", err)
    }
  }

  return await provider.runTool({
    accessToken,
    tool,
    params,
  })
}

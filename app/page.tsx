import { getSession } from "@/lib/core/auth"
import config from "@/lib/core/config"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getSession()
  if (!session) {
    redirect(config.auth.loginUrl)
  }

  redirect("/dashboard")
}

export const dynamic = "force-dynamic"

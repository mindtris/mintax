import { BrandingView } from "@/components/engage/branding-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Branding",
}

export default async function BrandingPage() {
  return <BrandingView />
}

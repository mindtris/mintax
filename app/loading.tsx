import { LogoLoader } from "@/components/ui/logo-loader"

export default function AppLoading() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-background">
      <LogoLoader size="lg" />
    </div>
  )
}
